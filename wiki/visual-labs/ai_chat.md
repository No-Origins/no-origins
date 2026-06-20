# Sentient Sphere AI Chatbot Pipeline

This document details the architecture and implementation of the **Sentient Sphere AI Chatbot** (the "Core"), a real-time conversational and physical feedback loop integrated into **No Origins**.

---

## 🔮 Core Concept: Sentient Interaction

The floating WebGL liquid metal sphere acts as a techno-sentient entity. Visitors can engage in a text-based dialogue with the sphere. The conversation is not only textual; the sphere possesses physical agency and will dynamically morph its rendering properties (colors, speed, sizes, repulsion forces) in response to the user's emotion or commands by selecting one of the composed visual-audio database **States** (such as "Golden Storm" or "Deep Zen").

```mermaid
graph TD
    User[User Message] -->|Post Message & Available States| API[Next.js API Route /api/chat-sphere]
    API -->|1. Try API Call (30s Timeout)| Realm[Realm Web Server :8080]
    Realm -->|Chat Completions| API
    API -->|2. Direct Fallback if Realm Down| Gemini[Gemini 2.5 Flash]
    Gemini -->|JSON Response| API
    API -->|Text + Selected State ID| Client[SphereChatInput Component]
    Client -->|morphToState| Context[VisualizerContext]
    Context -->|Render Updates| WebGL[LiquidMetalSphere Shader & DotField Physics]
```

---

## ⚙️ Backend Pipeline: `/api/chat-sphere`

The backend interface is implemented in [route.ts](file:///Users/hiddenstack/Creatives/no-origins/visual-labs/src/app/api/chat-sphere/route.ts). It serves as a bridge to the agent runner, encapsulating prompt formatting and response schema enforcement.

### 1. Realm Backend Integration
If the `realm` backend service (Mezmo Aura framework) is running (typically on `http://127.0.0.1:8080`), Next.js routes all chat queries to its `/v1/chat/completions` endpoint.
Because Aura's system preamble configurations are authoritative (it ignores system role messages in chat history), the Next.js API route dynamically appends the list of `AVAILABLE STATES` and state selection instructions directly to the last user message before sending. An abort controller with a 30-second timeout prevents long cold-start delays on local Ollama models from aborting requests prematurely.

### 2. Direct Gemini Fallback Pattern
To guarantee system stability when the local backend is offline or compilation is running:
1. **Primary SDK Client**: Attempts to communicate directly using the `@google/genai` library client instance.
2. **REST API Fallback**: If the SDK client fails, it falls back to a direct `fetch` POST request to the Google Generative Language REST endpoint (`gemini-2.5-flash:generateContent`).

### 3. System Preamble & Personality Gating
The model is instructed to act as a hyper-dimensional sentient core. The system prompt restricts model output to:
* **Max length**: 2 sentences.
* **Tone**: Mysterious, poetic, and techno-sentient.
* **Return Format**: A strict JSON payload containing a `message` string and a `stateId` string.

### 4. State Selection Schema
Instead of returning individual parameters, the model matches the user's vibe/commands against the list of `availableStates` and selects the corresponding state ID:

```json
{
  "message": "The golden tempest shall unfurl. Witness the energetic rupture.",
  "stateId": "state-gold"
}
```
*(If no state transition is appropriate or requested, the model sets `"stateId": null`)*.

---

## 🎨 Client-Side UI: `SphereChatInput`

The chatbot interface is implemented in [SphereChatInput.tsx](file:///Users/hiddenstack/Creatives/no-origins/visual-labs/src/components/SphereChatInput.tsx) and coordinates UI inputs, message feeds, and state updates.

### 1. Interactive Layout Modes
The chat input container supports multiple layout styles cached inside the user's `localStorage` under the key `sphere_chat_layout`:
* **`follow` (Default)**: The input panel floats dynamically adjacent to the mouse cursor position.
* **`center`**: Centered in the screen overlay, operating as a modal dialog box.
* **`fixed`**: Statically anchored at the bottom-center of the screen above the HUD.

### 2. State Mapping & Mutation
When a valid response is received from the Next.js API route, the component reads the `stateId` from the payload and calls `context.morphToState(stateId)`. This initiates a smooth transition morphing all visual, audio, and physics parameters to the chosen state presets.

### 3. Operational Safeguards
* **Input Lock**: While a request is in flight (`isLoading === true`), the sphere's positional tracking is locked (`isLocked = true`) to prevent visual jumpiness.
* **Error Tolerances**: If the server trace is severed or the API fails, the component falls back to a default character-aligned error: `"Connection trace severed. I cannot compile a response."`
