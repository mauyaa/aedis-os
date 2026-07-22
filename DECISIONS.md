# Decisions

1. **One complete domain pack.** Electronics J2 seating is the only scored inspection; unrelated scope was cut.
2. **Local Spatial is production, not a mock fallback.** It analyzes decoded pixels and declares measurements, thresholds, confidence, and uncertainty.
3. **Optional OpenAI is explicit.** Responses and Realtime adapters remain implemented behind `OPENAI_LIVE_ENABLED=true`; disabled features are never presented as active.
4. **Verification is outcome-driven.** Empty new findings never resolve old ones. Exactly one matching newer-frame outcome is required for each unresolved finding.
5. **Only rendered anchor types are accepted.** The active contract is box-only.
6. **Real frame capture, no continuous-video claim.** Camera preview stays local; one requested frame is analyzed.
7. **Browser-native voice is progressive enhancement.** It is labeled accurately and every command has a button.
8. **Browser-local MVP history.** No durable multi-tenant persistence claim is made.
9. **Internal incident always works.** External signed delivery is optional and accurately labeled.
10. **Exact action confirmation.** Short-lived tokens bind identity, session, finding, severity, action version, destination, expiry, and nonce.
11. **Owned target pair.** Before/after assets enable reproducible evaluation without third-party material.
