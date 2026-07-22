# Aegis-OS Build Week development record

This repository was built and adversarially repaired in the primary Codex task during Build Week.

## Engineering sequence

1. Built the two-loop inspection workspace: conversational control plus precision spatial analysis.
2. Defined strict Zod and JSON Schema contracts, 0–1000 coordinates, session authorization, human-confirmed actions, reporting, and judge assets.
3. Deployed the initial build and used real production errors to repair JSON Schema compatibility (`oneOf` to supported strict forms and typed discriminators).
4. Confirmed the remaining 429 was account quota, not a schema or transport defect. No mock success was introduced.
5. Adopted the no-credit release architecture: a real Local Spatial production engine plus explicitly disabled optional OpenAI adapters.
6. Implemented decoded-pixel validation, scene metrics, canonical alignment, global/ROI comparisons, confidence and uncertainty.
7. Removed the unsafe “zero findings resolves all” shortcut and added explicit previous-finding verification outcomes with request/frame binding.
8. Added device-native Browser Voice Commands, exact internal incident confirmation, trusted report identity, throttles, and truthful UI state.
9. Replaced the false state-only E2E claim with actual desktop and mobile Playwright journeys.
10. Added fixture variants, no-credit/no-outbound-call tests, CI, evaluation reports, security scans, and release documentation.

## Human decisions

The owner chose the electronics technician workflow, the high-stakes requirement not to fabricate runtime OpenAI output, the no-credit constraint, the Work & Productivity category, the premium technical interface direction, and the priority of a complete judge journey over unrelated feature expansion.

## Codex/GPT-5.6 distinction

GPT-5.6 was meaningfully used through Codex during the design,
implementation, testing, and adversarial review of Aegis-OS.
The submitted hosted judge path uses the deterministic Local Spatial
Engine because Build Week credits are Codex credits rather than API credits.
The optional GPT-5.6 Responses adapter remains implemented but is not
presented as active in the submitted deployment.

No claim is made that GPT-5.6 generated the hosted judge findings. Detailed file evidence is in `docs/judging/GPT56_CODEX_CONTRIBUTIONS.md`.
