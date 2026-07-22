# Known limitations

- Local Spatial v1 is intentionally scoped to the project-owned `electronics-j2` connector-seating pack. Judge-kit results do not establish general accuracy or electrical safety.
- Exact aspect-ratio resizing is used after validation. Camera capture uses a fixed alignment guide and rejects weak framing; automatic perspective rectification is not claimed.
- Browser Speech Recognition availability and behavior are browser/device dependent. Buttons cover every command.
- Completed sessions live in browser local storage. There is no durable multi-device or organization database.
- Rate buckets and consumed action nonces are process-local and therefore best-effort across serverless instances. Tokens are short-lived and exactly bound to reduce risk.
- The external signed webhook is optional and unconfigured in the judge deployment. Internal incident creation is the demonstrated action.
- The PDF is checksummed and verification-aware, but not immutable, tamper-proof, or proof that client evidence was truthful.
- Optional GPT-5.6 Responses and GPT-Realtime-2.1 adapters are implemented but disabled and not live-verified in the no-credit deployment.
- No Web Serial, optical flow, continuous video understanding, automatic tracking, document retrieval, analytics dashboard, team administration, or billing is claimed.
