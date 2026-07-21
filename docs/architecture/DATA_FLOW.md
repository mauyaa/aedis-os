# Data flow

```mermaid
sequenceDiagram
  participant J as Judge
  participant B as Browser
  participant R as Realtime API
  participant P as Precision route
  participant G as GPT-5.6
  participant X as External receiver
  J->>B: Speak inspection request
  B<->>R: WebRTC audio + tool events
  R-->>B: request_precision_analysis
  B->>B: Capture selected actual frame
  B->>P: Signed session + JPEG + context
  P->>G: Responses API + strict schema
  G-->>P: Structured spatial result
  P->>P: Zod revalidation
  P-->>B: Validated result + metadata
  B->>B: Persist finding, overlay, procedure, audit
  J->>B: Approve exact incident action
  B->>X: Server-signed webhook if configured
  J->>B: Supply newer corrected frame
  B->>G: Verification analysis
  B->>B: Resolve only from newer evidence
```

Privacy boundary: the live preview and microphone exist only in the browser/WebRTC path. No continuous video or raw audio repository exists. Evidence JPEG data is sent only on a defined capture trigger and is not persisted by the current server.

