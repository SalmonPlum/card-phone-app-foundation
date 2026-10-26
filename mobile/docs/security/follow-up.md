# Dependency security follow-up

Requested by the user for the next iteration, 2026-10-26. Offline operation does not remove dependency/build-tool security requirements.

Baseline: `npm-audit-baseline.json`, saved from the user-run npm audit after the first real install. It reports 5 high findings, 0 critical. Packages named: expo, @expo/cli, @expo/code-signing-certificates, node-forge, zod. This is a package report, not five independently verified reachable application exploits.

## Next iteration

- Verify each advisory against the actual locked package/version and dependency path.
- Classify shipped runtime, development-server, build/signing, and test-only exposure; assess reachability before assigning app impact.
- Check compatible patched upstream versions; inspect proposed npm fix diffs before changing the lockfile. The baseline suggests Expo54.0.38 although this app uses58, so automated major-version fixes require particular care.
- Apply the smallest justified compatible updates/overrides, then run clean installation, Expo compatibility checks, typecheck, lint, domain/UI tests, native build and required smoke checks.
- Rerun npm audit on the network-enabled host and document residual findings with rationale and an upstream issue/follow-up date. No blanket suppression or claim of zero risk.

No dependency remediation has been performed in the current foundation phase, per the user request to address it next iteration.
