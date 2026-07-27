# Nested Sub-Projects Architecture

This document specifies the technical design, database schemas, cascading triggers, and frontend components implementing the nested sub-projects workspace hierarchy inside No Origins.

---

## 🗄️ Database Schema & Triggers

To support tree nesting, we add two new columns to the `public.projects` table:
1. `parent_project_id`: A UUID foreign key referencing `public.projects(id) ON DELETE CASCADE` representing the parent project.
2. `deleted_at`: A nullable timestamptz timestamp. When not null, the workspace is treated as soft-deleted.

### Cascading Soft-Delete Trigger
A PostgreSQL database trigger cascades soft-deletes recursively down the project hierarchy. Similarly, restoring a parent node restores child nodes that were soft-deleted in the same operation.

```sql
create or replace function public.handle_project_soft_delete()
returns trigger as $$
begin
  if new.deleted_at is not null and old.deleted_at is null then
    -- Cascade soft-delete down the tree
    update public.projects
    set deleted_at = new.deleted_at
    where parent_project_id = new.id and deleted_at is null;
  elsif new.deleted_at is null and old.deleted_at is not null then
    -- Cascade restore down the tree
    update public.projects
    set deleted_at = null
    where parent_project_id = new.id and deleted_at = old.deleted_at;
  end if;
  return new;
end;
$$ language plpgsql;
```

---

## 🎨 Frontend Architecture (`visual-labs`)

### 1. Collapsible Hierarchy Tree Sidebar (`ProjectHierarchySidebar.tsx`)
Rendered on the left side of the whiteboard canvas, this collapsible panel provides tree-based workspace navigation:
* **Root Finding**: Traverses up `parent_project_id` to locate the top-most parent of the current project family.
* **Local Construction**: Loads the user's active workspaces and recursively builds the descendant tree.
* **Interactions**:
  * Clicking a node navigates to `/projects/[id]` via route redirection.
  * Clicking the inline `+` button creates a new database sub-project directly underneath that node. If adding to the active project, it drops a `SubProjectCard` shape in the center of the canvas automatically.

### 2. Custom Canvas Sub-Project Shape (`SubProjectCardUtil.tsx`)
Registers the custom Tldraw shape `SubProjectCardShape` (`"sub-project-card"`):
* **Empty State**: Renders Name and Description input fields with an "Initialize" button. Inserts the sub-project in Supabase and updates the shape props.
* **Created Card State**: Displays a glassmorphic card with a folder-git icon, name, description summary, an edit button, and an "Open Board" button mapping to `/projects/[subProjectId]`.
* **Refactored Link Anchor**: The "Open Board" button is implemented as a native HTML `<a>` anchor, enabling normal click routing, as well as browser middle-click or Cmd/Ctrl+click to open the nested board in a new tab.
* **Parent-Scoped Publishing Badge**: Instead of showing an independent "Publish" button, sub-project cards show a "Via parent" status badge since publishing is managed at the root workspace level.

### 3. Canvas Navigation, Toolbar & Inline Menus (`TldrawCanvas.tsx`)
* **Custom Shape Tools**: Integrated shape tools (SubProjectCard, TableCard, TipTapCard), shape tool shortcuts, and custom toolbar button (FolderGit icon).
* **Inline Command Palette Dropdown**: Command palette (`Cmd+K`) item and action list are rendered directly inside inline dropdown content in the canvas top menubar for unified UI consistency.
* **Floating Parent Navigation Shortcut**: Displays a "Back to Parent: [parentProjectName]" button in the top-left header HUD next to the main Dashboard back button when navigating inside a nested child project.
* **Read-Only Mode & Framing**: Non-owner/visitor views disable editing toolbars, display a read-only badge, unblock store snapshot loading, and execute initial `zoomToFit` to center the workspace content automatically.

### 4. Dashboard, Publishing, & Trash
* **Personal Projects List**: Filters out soft-deleted projects and renders sub-project badges pointing to parents.
* **Cascading Publishing**: Publishing a root workspace cascades `is_published = true` to its entire recursive sub-project tree, ensuring nested child board links successfully resolve for public viewers.
* **Discovery Hub Filtering**: The Discovery Hub lists root workspaces only; published sub-projects are not surfaced as separate individual discovery entries, preserving layout clarity.
* **Trash Tab**: Displays soft-deleted projects. Offers **Restore** (sets `deleted_at = null`) and **Delete Permanently** (hard delete from database).

