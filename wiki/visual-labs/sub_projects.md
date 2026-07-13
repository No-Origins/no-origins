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

### 3. Canvas Navigation & HUD overrides (`TldrawCanvas.tsx`)
* Custom toolbar button (FolderGit icon) and Command palette (`Cmd+K`) item.
* Floating parent navigation shortcut: Displays a "Back to Parent: [parentProjectName]" button in the left of the header HUD next to the main Dashboard back button when nested.

### 4. Dashboard & Trash tab
* Personal projects list filters out soft-deleted projects and renders sub-project badges pointing to parents.
* **Trash tab**: Displays soft-deleted projects. Offers **Restore** (sets `deleted_at = null`) and **Delete Permanently** (hard delete from database).
