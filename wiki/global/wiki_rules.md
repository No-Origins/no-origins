# Agent Wiki Maintenance Rules

This playbook defines the strict guidelines, style conventions, and triggers for how AI agents must create, update, and maintain the repository wiki. Following these rules ensures the wiki remains a high-density, low-overhead resource for future agent sessions.

---

## ⚡ Trigger Conditions: When to Create or Update

AI agents must perform wiki modifications under the following conditions:

### 1. Create a Page
Create a new wiki page inside the appropriate repository subfolder (`wiki/global/`, `wiki/visual-labs/`, `wiki/realm/`) when:
- **New Abstraction**: Introducing a new context provider, hooks collection, or global state layer.
- **New Module**: Adding a new component with standalone logic (e.g., a preset panel, a user auth module).
- **New Integration**: Connecting to a new external API or third-party service (e.g., database schema changes, SDK hookups).

### 2. Update a Page
Modify an existing wiki page when:
- **State Changes**: Adding, removing, or changing variables in the Single Source of Truth (`VisualizerContext`).
- **Logic Refactors**: Optimizing WebGL render loops, switching audio synthesis methods, or modifying data-flow direction.
- **Workflows**: Adjusting the local development setups, build steps, or Git submodule protocols.

### 3. Log a Session
At the end of every successful task or session:
- Move the staged checklist and updates from `wiki/active_sprint.md` to `wiki/log.md`.
- Reset the `active_sprint.md` checklist and staging logs for the next sprint.

---

## 🎨 Writing Style Conventions (Agent-Optimized)

To maximize readability and minimize token costs:

*   **Focus on Intent ("Why"), Not Syntax ("How")**: Do not copy-paste raw blocks of code into the wiki. Code decays quickly. Explain the *concept*, the *math*, the *relationships*, and the *reasoning* behind the implementation.
*   **Absolute File Links**: Always use standard Markdown links with the absolute `file:///` scheme to reference code files, directories, and other wiki pages (e.g. `[VisualizerContext](file:///Users/hiddenstack/Creatives/no-origins/visual-labs/src/context/VisualizerContext.tsx)`). Do **not** wrap links in code backticks (e.g. use `[index.md](...)`, not `[`index.md`](...)`).
*   **Mermaid Flowcharts**: Use Mermaid diagrams for sequence paths, entity relations, and communication directions.
*   **No Placeholders**: Never commit wiki pages containing empty sections or `TODO` tags. If a feature is incomplete, mark it as a "Stub" with a defined scope.

---

## 📜 Logging Standards in `log.md`

All log entries in `wiki/log.md` must be appended chronologically using the formatting standard:
`## [YYYY-MM-DD] <operation> | <description>`

Operations are restricted to:
- `ingest`: Ingesting source documentation or updating wiki pages.
- `write`: Coding new features or adding code functions.
- `refactor`: Reworking codebase structures or folder layouts.
- `lint`: Performing audits on codebases or the wiki.

---

## 🔍 Wiki Maintenance & Audits (Linting)

AI agents should periodically audit the wiki (once per major sprint) to identify:
1. **Broken Links**: Dead `file:///` paths pointing to renamed or deleted functions/files.
2. **Context Leak**: Documentation placed in the wrong folder (e.g., placing frontend logic inside `wiki/realm/`).
3. **Stale Concepts**: Descriptions of features that have since been rewritten or discarded.
