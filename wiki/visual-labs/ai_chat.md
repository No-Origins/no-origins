# Sentient Sphere AI Chatbot Pipeline

This document details the architecture and implementation of the **Sentient Sphere AI Chatbot** (the "Core"), a real-time conversational and physical feedback loop integrated into **No Origins**.

---

## 🔮 Core Concept: Sentient Interaction

The floating WebGL liquid metal sphere acts as a techno-sentient entity. Visitors can engage in a text-based dialogue with the sphere. The conversation is not only textual; the sphere possesses physical agency and will dynamically morph its rendering properties (colors, speed, sizes, repulsion forces) in response to the user's emotion or commands by selecting one of the composed visual-audio database **States** (such as "Golden Storm" or "Deep Zen").

```mermaid
graph TD
    User[User Message] -->|Post Message & Available States| API[Next.js API Route /api/chat-sphere]
    API -->|1. Realm Check (Bypassed if Prod & no REALM_API_URL)| Realm[Realm Web Server :8080]
    Realm -->|Chat Completions| API
    API -->|2. Direct Fallback / Production Path| Gemini[Gemini 2.5 Flash]
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
To avoid serverless function execution timeout limits in production environments (such as Vercel), the route detects if the node environment is `"production"`. If `NODE_ENV === "production"` and `REALM_API_URL` is not explicitly set, it bypasses the Realm call entirely and goes directly to the Gemini API.

Because Aura's system preamble configurations are authoritative (it ignores system role messages in chat history), the Next.js API route dynamically appends the list of `AVAILABLE STATES` and state selection instructions directly to the last user message before sending. An abort controller with a 30-second timeout prevents long cold-start delays on local Ollama models from aborting requests prematurely.

### 2. Direct Gemini Fallback / Production Pattern
To guarantee system stability when the local backend is offline or when running in production:
1. **Chat History Sanitization**: The Gemini API strictly requires that a chat history start with a message from the `user` role and alternate roles. The API route filters the incoming client history, locating the first message from a `"user"` and slicing the array from that point forward (omitting any leading greeting/system messages from the model).
2. **Primary SDK Client**: Attempts to communicate directly using the `@google/genai` library client instance.
3. **REST API Fallback**: If the SDK client fails, it falls back to a direct `fetch` POST request to the Google Generative Language REST endpoint (`gemini-2.5-flash:generateContent`).

### 3. System Preamble & Personality Gating
The model is instructed to act as a hyper-dimensional sentient core. The system prompt restricts model output to:
* **Max length**: 2 sentences.
* **Tone**: Mysterious, poetic, and techno-sentient.
* **Return Format**: A strict JSON payload containing `message` (string), `stateId` (string/null), and `route` (string/null).

### 4. State Selection & Navigation Schema
Instead of returning individual parameters, the model matches the user's vibe/commands against the list of `availableStates` and selects the corresponding state ID, and matches requests to travel or navigate to pages against the list of available paths:

```json
{
  "message": "The golden tempest shall unfurl. Witness the energetic rupture.",
  "stateId": "state-gold",
  "route": "/labs"
}
```
*(If no state transition is appropriate, `"stateId"` is set to `null`. If no page navigation is requested, `"route"` is set to `null`)*.

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

---

## 🔒 Feature Gating: \`NEXT_PUBLIC_ENABLE_AI_AGENT\`

To satisfy deployment and staging constraints, the AI Agent feature can be hidden and disabled. This is controlled by the environment variable:

\`NEXT_PUBLIC_ENABLE_AI_AGENT\`

### Behaviors when Disabled (Set to anything other than \`"true"\`, or unset):
1. **Client-side Layout**: The \`<SphereChatInput />\` component is not rendered inside the main \`BaseLayout\` (\`layout.tsx\`), preventing trigger keyboard shortcuts and layout updates from initializing.
2. **HUD Controls**: The "Input Controls" tab/panel is filtered out and hidden from both the Visitor HUD (\`InteractiveHUD.tsx\`) and the Admin Control Console (\`admin/page.tsx\`).
3. **Backend Safeguard**: The \`/api/chat-sphere\` API handler checks this variable on invocation and immediately returns a \`404\` error payload, rejecting any automated or direct queries.
