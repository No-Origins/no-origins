# No Origins Ecosystem Context

Welcome to the **No Origins** workspace. This repository acts as the parent repository and umbrella layout for the components that build the No Origins web application and procedural visual-audio sandbox.

## Repository Architecture

This workspace is structured as a multi-component workspace leveraging Git submodules:

1.  **[visual-labs](file:///Users/hiddenstack/Creatives/no-origins/visual-labs)**: Next.js 15 app router application providing the reactive WebGL particle field and procedural sound synthesis.
2.  **[realm](file:///Users/hiddenstack/Creatives/no-origins/realm)**: Backend server configuration and service code for storing and syncing presets and system variables.

---

## Git Submodule Management Rules

Because the components are standalone Git submodules, follow these critical rules to prevent broken pointer references:

1.  **Work inside submodules**: Perform all feature implementations and modifications directly inside the target submodule directories (e.g., `visual-labs/` or `realm/`).
2.  **Commit locally first**: Commit and push changes to the remote within the submodule repository first.
    ```bash
    # Example inside visual-labs/
    git add .
    git commit -m "feat: your-commit-message"
    git push origin main
    ```
3.  **Update root references**: After pushing submodule updates, run `git status` in the root repository, stage the updated submodule pointer change, and commit it to the root repo.
    ```bash
    # Inside no-origins root
    git add visual-labs
    git commit -m "chore: update visual-labs reference pointer"
    git push origin main
    ```

---

## Development Environment Setup

-   **Frontend Server**: Built on Next.js. Start the local server by navigating into `visual-labs/` and running:
    ```bash
    npm run dev
    ```
-   **Environment variables**: Make sure your local `.env.local` contains the `GEMINI_API_KEY` to enable the sentient sphere communication API.

---

## Agent-Wiki Collaboration Framework

We maintain a persistent, compounding wiki in the [wiki/](file:///Users/hiddenstack/Creatives/no-origins/wiki/) folder. It compiles technical and architectural knowledge once so subsequent agent sessions don't start from scratch.

### Core Wiki Files
- **[wiki/index.md](file:///Users/hiddenstack/Creatives/no-origins/wiki/index.md)**: Structured directory of all wiki pages.
- **[wiki/active_sprint.md](file:///Users/hiddenstack/Creatives/no-origins/wiki/active_sprint.md)**: Staging dashboard tracking active goals, checklists, and modified files for the current session.
- **[wiki/log.md](file:///Users/hiddenstack/Creatives/no-origins/wiki/log.md)**: Chronological append-only record of changes, sessions, and implementations.

### Rules of Engagement for AI Agents
1. **Wiki First (MANDATORY INGESTION)**:
   - Before writing any code, proposing modifications, or answering questions about features, you **MUST** read [wiki/index.md](file:///Users/hiddenstack/Creatives/no-origins/wiki/index.md) and [wiki/log.md](file:///Users/hiddenstack/Creatives/no-origins/wiki/log.md) to understand the system architecture and current state.
   - You **MUST** read [wiki/active_sprint.md](file:///Users/hiddenstack/Creatives/no-origins/wiki/active_sprint.md) to check if there is an ongoing task list or session context from a previous run.
2. **Active Sprint Tracking**:
   - If starting a new goal, initialize [wiki/active_sprint.md](file:///Users/hiddenstack/Creatives/no-origins/wiki/active_sprint.md) with a clear target and a checklist.
   - During implementation, mark task items as completed (`[x]`) or in-progress (`[/]`) and log files modified in the staging section of `active_sprint.md`.
3. **Repository-Based Directory Boundaries**:
   Keep pages organized according to the submodule boundaries:
   - `wiki/global/` for parent configuration, overall architecture, and git rules.
   - `wiki/visual-labs/` for frontend visualizer, state synchronization, audio, and WebGL specs.
   - `wiki/realm/` for backend schemas, database configs, and sync specs.
4. **Compile-on-Write Documentation**:
   - When introducing new features, refactoring architecture, or adding dependencies, you **MUST** update or create the relevant wiki files inside their respective repository directory.
   - If a new page is added, register it in `wiki/index.md`.
   - Once the active goal is completed, compile the changes, clear `active_sprint.md` for the next run, and append an entry to `wiki/log.md`. Use the formatting standard:
     `## [YYYY-MM-DD] <operation> | <description>` (Operations: `ingest`, `write`, `refactor`, `lint`).
5. **Wiki Maintenance (Linting)**:
   - Keep links clean and bidirectional.
   - Periodically look for dead references, conflicting claims, or outdated specs, updating them immediately.
   - Follow the detailed guidelines inside the **[Wiki Maintenance Playbook](file:///Users/hiddenstack/Creatives/no-origins/wiki/global/wiki_rules.md)** for all wiki creation, modification, logging, and audit processes.




