# OpenAI integration

## Realtime loop

The authenticated browser creates a WebRTC offer and posts SDP to `/api/realtime`. The route builds the versioned electronics prompt, hashes organization and internal user IDs into the safety identifier, sets server VAD and `marin` voice, declares the strict precision-analysis tool, and relays multipart SDP/session configuration to `/v1/realtime/calls` with the server API key. The SDP answer returns to the peer. Speech start interrupts output; data-channel function events trigger real capture.

## Precision loop

The browser captures JPEG pixels from the current camera video element or selected image. `/api/analysis` validates size, IDs, intent, current step, and prior findings. The route calls environment-configurable `gpt-5.6` with high image detail and a strict `inspection_result` JSON Schema. The result is parsed and independently validated. Coordinates outside 0–1000, overflowing boxes, missing evidence, unknown properties, invalid frame references, and evidence-free passes fail. One repair request is allowed; repeated invalid output becomes HTTP 502.

The UI never displays hidden reasoning. It displays only factual connection, capture, analysis, finding, verification, approval, execution, and failure states.

