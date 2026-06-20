# Realm Agent Society Protocols & Tool Governance

This document establishes the **communication protocols, tool-execution constraints, and Human-in-the-Loop (HITL) workflows** that govern interactions within the Realm Agent Society of **No Origins**.

---

## 🔌 Section 1: Inter-Agent Communication (A2A)

The agents inside the Mezmo Aura backend communicate using the standard **Agent-to-Agent (A2A) Protocol 1.0**. 

### 1. Message Dispatch Protocol
A2A communication operates asynchronously by default. When an agent dispatches a message, the server queues the task and responds immediately with a `Working` task status.

*   **A2A Endpoint**: `/a2a/v1/message:send`
*   **Request Method**: `POST`
*   **A2A Headers**:
    *   `A2A-Version: 1.0` (validated for JSON-RPC, optional for REST)
    *   `x-aura-model: [agent-alias]` (selects the target agent)

### 2. Message Payload Schema
All messages exchanged between agents must map to the structured `Message` format:

```json
{
  "message": {
    "messageId": "msg-[unique-uuid]",
    "role": "ROLE_USER",
    "parts": [
      {
        "text": "Task request or agent query payload"
      }
    ]
  }
}
```

### 3. Task Lifecycle Tracking
To check task status and retrieve final agent-response outputs, agents and API clients must either:
1.  **Poll**: `GET /a2a/v1/tasks/{id}`
2.  **Stream**: Subscribe to Server-Sent Events (SSE) via `GET /a2a/v1/tasks/{id}:subscribe`

---

## 🛠️ Section 2: Tool-Execution Governance

To ensure security and prevent anomalous behaviors, any custom tools mounted in TOML configuration files must enforce strict sanitization and schema checks.

### 1. Schema Validation
*   All tool arguments must be defined with JSON Schema schemas inside the MCP server configurations.
*   The Aura framework automatically parses, sanitizes, and validates incoming tool call inputs. Invalid schemas are immediately rejected before executing downstream actions.

### 2. File-Writing Boundaries
*   Agents equipped with file-write tools are restricted to paths within `realm/configs/` and temporary runtime memory directories (e.g., `orchestration.artifacts.memory_dir`).
*   Agents must never modify standard application source code (`/src`) or core Rust source code (`/crates`) unless explicitly authorized through a human override session.

---

## 👤 Section 3: Human-in-the-Loop (HITL) Approval Protocols

For actions classified as **High Risk**, agents must halt execution and await approval. This prevents unauthorized database mutations or system instability.

```
┌─────────────────────────────────┐
│ Agent initiates High-Risk Task  │
└────────────────┬────────────────┘
                 │
                 ▼
┌─────────────────────────────────┐
│     Trigger HITL Checkpoint     │
│   (State set to 'Awaiting')     │
└────────────────┬────────────────┘
                 │
                 ├──────────────────────────────┐
                 ▼                              ▼
        [ Human Approves ]             [ Human Rejects ]
                 │                              │
                 ▼                              ▼
┌─────────────────────────────────┐    ┌─────────────────────────────────┐
│       Task Resumes and          │    │     Task Cancelled, Agent       │
│        Returns Result           │    │    Receives Rejection Reason    │
└─────────────────────────────────┘    └─────────────────────────────────┘
```

### 1. High-Risk Action Registry
The following actions always trigger a HITL block:
*   **Database Migrations**: Executing SQL scripts that modify table definitions, column types, or Row-Level Security (RLS) configurations.
*   **Dependency Changes**: Modifying `Cargo.toml`, `package.json`, or executing package installation scripts (`npm install`, `cargo build`).
*   **Permanent Code Commits**: Staging file-write requests targeting React components or Rust server code.
*   **Submodule Reference Updates**: Running git command scripts that alter git submodule pointer addresses.

### 2. HITL Approval Flow
1.  The agent calls a tool that requires HITL.
2.  The Aura execution engine intercepts the tool call, generates an approval ID, and sets the task status to `AwaitingApproval`.
3.  The engine emits an event notifying the developer console (via API notification or local CLI).
4.  The developer reviews the proposed tool parameters and approves or rejects the action.
5.  If approved, the engine executes the tool and delivers the output back to the agent. If rejected, the agent receives an error payload detailing the rejection reason.
