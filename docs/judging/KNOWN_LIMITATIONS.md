# Known limitations

- No hosted deployment, OpenAI credential, or external receiver was available in the build environment, so live model calls, hosted voice, and external delivery were not claimed as executed.
- MVP records are durable in one browser profile, not in PostgreSQL. This is insufficient for cross-device production tenancy, centralized audit immutability, evidence binary retention, or team collaboration.
- The PDF contains finding/action/timeline content but does not yet embed original and annotated before/after image binaries.
- Only box anchors render. The shared contract accepts point, polygon, and arrow anchors, which require rendering before broader production use.
- The frame is explicit and high-quality but the advanced motion/blur/perceptual-hash worker and optical-flow tracking are Tier 3 work.
- No live-model accuracy, false-positive, calibration, or IoU claim is made. The included evaluation covers deterministic contracts and tamper rejection.
- The action nonce set is process-local; production must store consumed nonces durably.
- Additional domain packs, Web Serial, manual retrieval, full Supabase Auth/RLS, durable queues, and retention workers are not implemented.

