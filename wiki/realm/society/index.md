# Realm Agent Society Information Base

Welcome to the **Realm Agent Society** Information Base. This persistent knowledge base serves as the institutional charter, architectural map, and governance framework for the multi-level organizational societal agentic system running inside the `realm` backend module of **No Origins**.

---

## 👁️ Core Vision

The agent architecture of No Origins is designed to transition from a collection of isolated, utility-focused AI scripts into a structured, self-governing **societal system**. 

In this model, agents are not merely reactive API endpoints; they are citizens of an digital ecology governed by:
*   **Institutional Roles**: Distinct agents assigned specific scopes, models, and tool permissions.
*   **Constitutional Boundaries**: Hard safety thresholds and behavioral guidelines that align the society with developer and user intent.
*   **Collaborative Protocols**: Structured channels (A2A messaging, database sync, HITL checkpoints) that allow agents to cooperate, request resources, and make decisions collectively.

The ultimate goal is an autonomous, resilient backend society that manages the procedural visual-audio sandbox (`visual-labs`), maintains its database configuration, optimizes performance, and interacts poetically with human explorers.

---

## 🗺️ Societal Directory

To navigate the guidelines, rules, and structures of our agentic society, refer to the following documents:

1.  **[Constitution & Alignment](Wikis/no-origins/realm/society/constitution.md)**
    *   The core directives, ethical boundaries, character guidelines, and technical safety limits (turn depth, CPU, API usage) governing all agents.
2.  **[Taxonomy & Roles](Wikis/no-origins/realm/society/taxonomy.md)**
    *   The organizational hierarchy (Level 0: Interface, Level 1: Orchestration/Governance, Level 2: Specialists), agent configurations, and LLM provider pairings.
3.  **[Protocols & Tool Governance](Wikis/no-origins/realm/society/protocols.md)**
    *   A2A communication specifications, tool usage parameters, state transition routing, and Human-in-the-Loop (HITL) checkpoints.
4.  **[Decisions Registry](Wikis/no-origins/realm/society/decisions.md)**
    *   A chronological archive of architectural decisions, consensus logs, and policy revisions enacted by the society and its human operators.
5.  **[Emergent Future Sandbox](Wikis/no-origins/realm/society/future.md)**
    *   Brainstorming, exploratory ideas, and research paths for multi-agent evolution, decentralized databases, and real-time visualization of agent communication.

---

## 🏛️ System Architecture Map

```mermaid
graph TD
    User([Human Explorer]) <--> L0[Level 0: Sentient Sphere Interface]
    
    subgraph Realm Society (Mezmo Aura)
        L0 <-->|A2A Protocol / API Route| L1[Level 1: Governance Council / Orchestrator]
        L1 <-->|Decompose & Delegate| L2A[Level 2: Database Sync Specialist]
        L1 <-->|Decompose & Delegate| L2B[Level 2: Telemetry & Health Specialist]
        L1 <-->|Decompose & Delegate| L2C[Level 2: Optimization Specialist]
    end

    subgraph External Resources
        L2A <-->|RLS Policies / SQL| Supabase[(Supabase Database)]
        L2B <-->|Metrics Logs| Server[Web Server/Ollama Logs]
        L2C <-->|Custom Preset Schema| Filesystem[(Local Configs)]
    end
    
    classDef level0 fill:#111,stroke:#66a3ff,stroke-width:2px,color:#fff;
    classDef level1 fill:#222,stroke:#ff66cc,stroke-width:2px,color:#fff;
    classDef level2 fill:#333,stroke:#99ff66,stroke-width:1px,color:#fff;
    
    class L0 level0;
    class L1 level1;
    class L2A,L2B,L2C level2;
```

---

## 📜 Principles of Maintenance

This information base is a live document. AI agents acting in this workspace are expected to adhere to the [Wiki Maintenance Playbook](Wikis/no-origins/global/wiki_rules.md) and update these files whenever:
1. A new agent role is introduced or modified in `realm`.
2. A new communication protocol or custom tool is implemented.
3. An architectural decision is finalized (recorded in `decisions.md`).
