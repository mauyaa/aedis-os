# Optional OpenAI integration

The hosted judge deployment sets `OPENAI_LIVE_ENABLED=false`. Neither endpoint is called by the default Local Spatial workflow.

## GPT-5.6 precision adapter

When explicitly enabled, `/api/analysis` accepts `engine: "openai-precision"`, checks the signed inspection session and bounded request, sends one explicit image to the Responses API, requests the strict `inspection_result` JSON Schema, runs independent Zod validation, then enforces request ID, frame ID, previous-finding, evidence, scene, confidence, and newer-frame rules. One schema repair attempt is allowed. Timeout, quota, rate, authentication, availability, and repeated structured-output failures are mapped without returning provider bodies to the browser.

## GPT-Realtime-2.1 adapter

When explicitly enabled, `/api/realtime` validates SDP, builds a server-side session, and relays it with the server API key. `createRealtimeToolHandler` validates `request_precision_analysis`, preserves and deduplicates `call_id`, awaits a validated precision result, sends a bounded `function_call_output`, then sends `response.create`. It excludes images, prompts, credentials, hidden reasoning, and unbounded output. Failures return a truthful bounded tool failure; a disconnected channel receives nothing.

The optional adapters were not live-verified in the no-credit release and are not represented as active production capabilities.
