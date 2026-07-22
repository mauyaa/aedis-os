# Production verification

Status: pending deployment of the no-credit release commit.

| Field | Value |
| --- | --- |
| Test date | 2026-07-22 (Africa/Nairobi) |
| Deployment URL | https://aegis-os-delta.vercel.app |
| Deployment SHA | Pending final release commit |
| Local engine | `local-spatial@1.0.0` |
| Inspection pack | `electronics-j2@1.0.0` |
| Browser | Chromium desktop and Pixel 5 emulation locally; production recheck pending |
| OpenAI live setting | Must be `false` |

## Required post-deploy checks

- Homepage and security headers return 200.
- Ephemeral judge session starts without API key, payment, or access code.
- Fault frame returns Local Spatial metadata, J2 finding, evidence, confidence, overlay, and failed procedure.
- Incident reject/approve creates an internal incident without claiming external delivery.
- Corrected newer frame explicitly resolves the exact previous finding.
- Completion, checksummed PDF, and History work.
- Mobile 390–430 px layout is usable.
- Default path creates no OpenAI request and no 429.
- Production runtime error scan is clean.

This file must be updated with the actual deployment SHA, hosted results, and runtime scan before the repository is described as production verified.
