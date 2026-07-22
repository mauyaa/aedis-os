# Submitted data flow

```mermaid
sequenceDiagram
  participant J as Judge
  participant B as Browser
  participant A as Analysis route
  participant L as Local Spatial Engine
  participant P as Inspection pack
  J->>B: Load/upload/capture image
  B->>B: Decode visual into explicit PNG frame
  B->>A: Signed session + frame + intent + prior findings
  A->>A: Validate session, body, IDs, dimensions and MIME
  A->>L: Decode actual pixels
  L->>P: Load electronics-j2@1.0.0
  L->>L: Scene, alignment, global and J2 ROI distances
  L-->>A: Strict result + local engine metadata
  A->>A: Bind request, frame and verification outcomes
  A-->>B: Validated result
  B->>B: Overlay, timeline and procedure transition
  J->>B: Approve exact internal incident
  J->>B: Supply newer corrected frame
  B->>A: Explicit verification request
  A-->>B: resolved / still_present / uncertain
```

Continuous video and raw audio remain in the browser. Only an explicit captured frame is sent. The server does not persist evidence in this MVP. Browser Speech Recognition and speech synthesis are device-native controls; they are not OpenAI Realtime.
