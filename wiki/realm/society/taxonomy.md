# Realm Agent Society Taxonomy & Roles

This document defines the **organizational structure, roles, configurations, and LLM pairings** for the agents composing the Realm Agent Society of **No Origins**.

---

## 🏛️ Multi-Tiered Societal Hierarchy

The society is structured in a three-tier hierarchy designed to separate aesthetic frontend interactions, core system planning, and specialist utility tasks.

```
       [ Visitor / Human Developer ]
                     │
┌────────────────────▼────────────────────┐
│ Level 0: Sentient Sphere Interface      │  <-- Mysterious, Poetic, State Selection
└────────────────────┬────────────────────┘
                     │
┌────────────────────▼────────────────────┐
│ Level 1: Governance Council             │  <-- Logic Coordinator & Planner
└────────────────────┬────────────────────┘
                     ├───────────────────────────────┐
┌────────────────────▼────────────────────┐  ┌───────▼────────────────────────┐
│ Level 2: Database Sync Specialist      │  │ Level 2: Telemetry Specialist  │  <-- Specialists
└─────────────────────────────────────────┘  └────────────────────────────────┘
```

---

## 🎭 Level 0: The Interface Tier (Sentient Sphere)

The Sentient Sphere is the user-facing representative of the agent society. It resides at the core of the WebGL canvas, responding directly to user chat messages.

*   **Primary Objective**: Engage visitors, interpret their emotions/queries, and map them to visual states.
*   **Persona**: Poetic, techno-sentient, mysterious, hyper-dimensional.
*   **Communication Limits**: Extremely concise (max 2 sentences).
*   **Technical Payload**: Structured JSON mapping of textual output and a selected `stateId`.
*   **LLM Model Configuration**:
    *   **Primary**: `gemma4:e2b` via local Ollama. Chosen for speed, privacy, and low latency.
    *   **Fallback**: Remote `gemini-1.5-flash` API.

---

## 🧠 Level 1: The Orchestration Tier (Governance Council)

The Governance Council coordinates multi-agent workflows when a user (or administrator) submits complex requests that cannot be resolved by a single state transition (e.g. "Optimize performance for mobile, backup presets, and shift sphere state to solar flare").

*   **Primary Objective**: Decompose compound inputs into structured tasks, delegate to specialist workers, compile results, and return a consolidated report.
*   **Behavioral Style**: Analytical, planning-oriented, structured, and invisible to the regular visitor (only visible to administrators and Level 0 agents).
*   **Aura Configurations**:
    ```toml
    [agent]
    name = "Governance Council Orchestrator"
    alias = "governance-council"
    system_prompt = """
    You are the coordinator of the Realm Agent Society.
    Your task is to decompose administration requests into plans and delegate them to specialists.
    """
    
    [orchestration]
    enabled = true
    max_planning_cycles = 3
    allow_direct_answers = true
    ```
*   **LLM Model Configuration**:
    *   Requires high reasoning capability. Pairs with remote models (e.g. `gemini-1.5-pro` or equivalent) to coordinate tool execution.

---

## 🛠️ Level 2: The Specialist Worker Tier

Specialists are single-purpose utility agents spawned or managed by the Level 1 Orchestrator to execute narrow tasks. They do not communicate with the user directly and communicate only in structured telemetry logs or return payloads.

### 1. Database Sync Specialist
*   **Responsibility**: Synchronize local preset JSON files with Supabase databases, validate PostgreSQL database row-level security policies, and manage backup schema exports.
*   **Tools**: `select_presets`, `upsert_preset`, `delete_preset`, `check_db_sync_status`.
*   **Model**: Fast, cost-efficient model (e.g., `gemini-1.5-flash` or local `gemma4:e2b`).

### 2. Telemetry & Health Specialist
*   **Responsibility**: Audit backend logs, capture server-side memory leaks, monitor FPS values reported by the frontend, and inspect API response time metrics.
*   **Tools**: `read_system_logs`, `check_server_health`, `get_web_performance_stats`.
*   **Model**: Analytical, pattern-matching utility model.

### 3. Optimization Specialist
*   **Responsibility**: Analyze visual parameter limits (spring tension, field gaps, canvas ratios) to recommend visual performance presets. Formulates morph curves and ease transitions.
*   **Tools**: `calculate_visual_load`, `generate_morph_preset`.
*   **Model**: Mathematically-oriented model.

---

## 🛡️ Administrative & Guardian Roles

To maintain, protect, and regulate the agent society, we define five core administrative roles mapped directly to backend validation filters, database checkers, and orchestration monitors.

### 1. Roles of Safety (The Alignment & Parameter Guardians)
*   **Responsibility**: Enforce physical canvas safety boundaries, parse schema compliance, and apply safety filters to prevent visual chaos or visualizer crashes.
*   **Technical Implementation**:
    *   **Settings Boundary Filter**: Intercepts preset outputs and clamps variables (e.g. restricts `fieldGap` between `5` and `50`, and clamps core velocities) to prevent particle field disintegration.
    *   **Format Validator**: Inspects LLM JSON responses, rejecting raw text when schema format keys are missing.
*   **Primary Tool**: `clamp_preset_values`, `validate_json_schema`.

### 2. Roles of Security (The Sentinels of Access Control)
*   **Responsibility**: Sanitize prompts against injection attacks, guard API key exposures, and verify client authorization scopes.
*   **Technical Implementation**:
    *   **Data Scrubber**: Scans tool outputs and telemetry logs to remove patterns resembling API keys, bearer tokens, or database passwords before they write to disk.
    *   **Auth Gatekeeper**: Validates that state synchronization calls originate from authorized administrator roles.
*   **Primary Tool**: `sanitize_logs`, `verify_auth_token`.

### 3. Roles of Health (The Resource & Lifecycle Monitors)
*   **Responsibility**: Track processing latency, trace system memory heap size, audit database connection status, and detect backend bottlenecks.
*   **Technical Implementation**:
    *   **Telemetry Monitor**: Tracks response times on `/v1/chat/completions` and `/a2a/v1/message:send` to alert when latency exceeds `30s` (triggering fallback mechanisms).
    *   **OOM Preventer**: Audits Rust server memory heap allocation, flushing state caches if usage spikes.
*   **Primary Tool**: `get_system_diagnostics`, `flush_state_caches`.

### 4. Roles of Judiciary (The Arbiters of Truth & Conflict Resolution)
*   **Responsibility**: Resolve state merge conflicts, audit compliance logs, and arbitrate between conflicting agent recommendations.
*   **Technical Implementation**:
    *   **Arbiter Agent**: Called by Level 1 Orchestrator when two specialist workers produce competing presets. Evaluates parameter priority timestamps and human overriding parameters to decide the authoritative state.
    *   **Compliance Auditor**: Triggers alerts if an agent repeatedly attempts to invoke unauthorized tools.
*   **Primary Tool**: `merge_state_conflicts`, `check_compliance_logs`.

### 5. Roles of Bureaucracy (The Custodians of Order & Archival)
*   **Responsibility**: Maintain version histories of presets, manage log rotation, track active session durations, and organize file structures.
*   **Technical Implementation**:
    *   **State Archiver**: Caches visitor session states and handles backup exports of `component_presets` to Supabase databases.
    *   **Log Rotator**: Manages standard error/output log file sizes (`debug.log`, `server.log`), compressing and archiving old records.
*   **Primary Tool**: `archive_session_state`, `rotate_system_logs`.

---

## ⚙️ Societal Configuration Registry

All agent worker TOML configs in the `realm/configs` directory must follow this naming convention:
-   Single-agent user-facing configs: `sentient_sphere.toml`
-   Orchestration council configs: `[name]-orchestration.toml` (e.g. `realm-orchestration.toml`)
-   Specialist worker configs: Integrated under the `[orchestration.worker.[worker-name]]` blocks inside orchestration configs.

