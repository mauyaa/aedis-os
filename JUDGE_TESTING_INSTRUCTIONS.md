No API key, payment, account, or proprietary hardware is required.

# Aegis-OS judge test — under three minutes

Open https://aegis-os-delta.vercel.app in current Chrome.

1. Keep the prefilled email and workspace display name. Leave access code empty unless the organizer supplied one. Choose **Enter judge workspace**.
2. Confirm the header says **EPHEMERAL JUDGE WORKSPACE** and the engine bar says **Local Spatial v1** / **LOCAL SPATIAL ENGINE · AVAILABLE**.
3. Choose **Load fault target**, then **Inspect frame**.
4. Confirm a J2 box appears and the finding says **J2 connector is not fully seated**. Expand the engine badge to see the real measurements used.
5. Choose **Create internal incident**. Review the exact effect. Choose **Reject** once, repeat, then **Confirm exact action**.
6. Choose **Corrected** in the control deck, then **Verify correction**.
7. Confirm the finding is `resolved`, a new frame ID is shown, and the timeline records the explicit transition.
8. Choose **Complete inspection**, verify the local History entry, then **Download checksummed PDF**.

Optional Chrome voice path: choose **Browser voice** and say “inspect this board,” “verify correction,” “create incident,” “complete inspection,” “download report,” or “stop listening.” The transcript is visible, ambiguous phrases are ignored, and incidents still require manual approval.

The public path analyzes real decoded pixels against `electronics-j2@1.0.0`. It does not call OpenAI and should not show a quota error. The OpenAI Precision and Realtime adapters are optional, disabled, and irrelevant to this test.

GPT-5.6 was meaningfully used through Codex during the design,
implementation, testing, and adversarial review of Aegis-OS.
The submitted hosted judge path uses the deterministic Local Spatial
Engine because Build Week credits are Codex credits rather than API credits.
The optional GPT-5.6 Responses adapter remains implemented but is not
presented as active in the submitted deployment.
