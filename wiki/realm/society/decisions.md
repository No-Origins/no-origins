# Realm Agent Society Decisions Registry

This document records the **chronological design and governance decisions** enacted by the human developers and AI agents of the Realm Agent Society of **No Origins**.

---

## 🏛️ Decision Structure
All registry entries must follow this format:
-   **ID**: `RAS-[Index]`
-   **Title**: Short description of the decision
-   **Status**: `Proposed` | `Under Review` | `Accepted` | `Deprecated`
-   **Date**: Date of decision
-   **Context**: The problem we are addressing
-   **Decision**: The policy or architecture adopted
-   **Consequences**: The results, tradeoffs, and next steps of the decision

---

## 📜 Active Registry

### RAS-001: Adoption of Mezmo Aura Framework
*   **Status**: Accepted
*   **Date**: 2026-06-19
*   **Context**: We needed a production-ready, high-performance agentic harness in the backend (`realm`) module to coordinate LLM orchestration, support the Model Context Protocol (MCP), and interface with our Next.js frontend using standard API structures.
*   **Decision**: Integrated Mezmo Aura as our primary Rust-based backend agentic framework. 
*   **Consequences**:
    *   Exposes OpenAI-compatible REST endpoints `/v1/chat/completions`.
    *   Exposes `/a2a/v1` endpoints for Agent-to-Agent communication.
    *   Requires a Rust Nightly compilation toolchain.

---

### RAS-002: Transition to Local Ollama/Gemma Execution
*   **Status**: Accepted
*   **Date**: 2026-06-19
*   **Context**: The user-facing Sentient Sphere chatbot was initially bound to remote Gemini API keys. High chat frequencies led to API quota exhaustion and connection errors, disrupting the sandbox user experience.
*   **Decision**: Configured the primary `sentient_sphere.toml` to run `gemma4:e2b` locally via Ollama, while maintaining the remote Gemini SDK as a fallback in Next.js `route.ts`.
*   **Consequences**:
    *   Eliminated external API quota limits for standard sandbox interactions.
    *   Increased Next.js request timeout limits to 30 seconds to support local model warm-up latency.
    *   Requires Ollama to be running locally with the `gemma4:e2b` model loaded.

---

### RAS-003: Establishment of Society Information Base
*   **Status**: Accepted
*   **Date**: 2026-06-19
*   **Context**: As the system grows from a single user-facing chatbot into a multi-level agentic workspace, there was no centralized framework documenting role taxonomies, alignment constraints, or communication protocols.
*   **Decision**: Created the **Realm Agent Society Information Base** under the `wiki/realm/society/` directory to serve as a compounding repository of society rules, roles, and guidelines.
*   **Consequences**:
    *   Provides clear directories and maps (`index.md`).
    *   Enforces safety limits and dual-persona communication rules (`constitution.md`).
    *   Maps out multi-tiered roles and LLM pairings (`taxonomy.md`).
    *   Defines A2A channels and Human-in-the-Loop checkpoints (`protocols.md`).
