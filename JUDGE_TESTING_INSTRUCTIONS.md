# Judge testing instructions

## Hosted path status

No hosted URL or judge password is claimed yet. The owner must deploy with the environment values below. Local evaluation requires Node 20.9+, pnpm, and server credentials; judges never enter an OpenAI key in the browser.

## Required hosted configuration

`OPENAI_API_KEY`, `OPENAI_REALTIME_MODEL=gpt-realtime-2.1`, `OPENAI_INSPECTION_MODEL=gpt-5.6`, `SESSION_SECRET`, `AEGIS_EXTERNAL_WEBHOOK_URL`, and `AEGIS_EXTERNAL_WEBHOOK_SECRET`.

## Three-minute test path

1. Enter `judge@aegis.local` and `Aegis Judge Lab` on the workspace gate.
2. Click **Load fault target** (or connect a camera and display `public/judge-kit/aegis-board-fault.png`).
3. Start voice and say: “Inspect this board and tell me whether I can continue.” If microphone access is unavailable, click **Inspect frame**.
4. Observe actual capture, GPT-5.6 analysis, spatial overlay, evidence, confidence, and procedure state.
5. Click **Create maintenance incident**, inspect the exact effect, then approve it. Confirm the internal incident and external delivery reference.
6. Return to the empty/source selector as needed and load `aegis-board-corrected.png`, then click **Verify correction**.
7. Confirm the newer frame resolves the prior finding only when the live result supports it.
8. Complete the inspection, download the PDF, and inspect History/Timeline.

Expected fault: the white cable at J2 is visibly disconnected above its socket. Do not expect or accept electrical measurement claims.

