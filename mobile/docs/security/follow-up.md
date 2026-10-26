# Dependency security follow-up

Reviewed 2026-10-26 against the installed source and official advisories. Offline operation does not remove dependency/build-tool security requirements.

Baseline: [`npm-audit-baseline.json`](npm-audit-baseline.json) records 5 high findings and 0 critical. Expo and its CLI/signing packages inherit the two underlying advisories; these are not five independently demonstrated app exploits.

## Verified dependency paths

| Advisory | Installed path before remediation | Status |
| --- | --- | --- |
| [GHSA-mrhx-c7xc-m3w5](https://github.com/advisories/GHSA-mrhx-c7xc-m3w5) | `expo@58.0.17 → @expo/cli@58.1.15 → zod@3.25.76` | Advisory fixes versions below 4.6.6 in 4.6.6. A CLI-scoped override to 4.6.7 is prepared; host installation/audit pending. |
| [GHSA-86w9-cpqp-85rv](https://github.com/advisories/GHSA-86w9-cpqp-85rv) | CLI directly and through `@expo/code-signing-certificates@0.0.7 → node-forge@1.4.0` | Affected through 1.4.0; no patched version listed. Residual upstream risk. |

The lint tree already resolves Zod 4.6.7, independently of the CLI's affected copy. The override targets `@expo/cli` only; Expo, React Native and native module versions stay pinned. Zod 3 to 4 is a major API change, even though the override is narrow. It must be rechecked when Expo CLI changes. See the [official migration guide](https://zod.dev/v4/changelog).

## Zod compatibility and exposure

The installed CLI imports Zod only in `DevToolsPlugin.schema.js` and `createMCPDevToolsExtensionSchema.js`. Consumers validate local plugin descriptors, plugin command output and generated MCP command inputs. They use object/string/number/boolean/enum/array/union schemas, optional/readonly/strict/describe, `safeParse`, and error `issues`/`message`. Focused checks load these actual CLI exports, accept valid descriptors/output/commands, reject malformed inputs, and check readonly and strict semantics.

`npm run test:security` also resolves Zod from the CLI itself and checks that an oversized bounded array rejects before element validation. It failed on 3.25.76 (three elements visited) and passed in a pre-install compatibility experiment using the installed patched 4.6.7. This experiment is not an installed-dependency verification; that run remains pending installation.

The [upstream patch](https://github.com/colinhacks/zod/commit/a0ebf97) gates oversized bounded collections before walking elements. It does not cap all unbounded validation. CLI plugin arrays remain unbounded; only run trusted development plugins and avoid exposing development tools publicly. No app source imports Zod.

The optional `expo-mcp` and `@expo/mcp-tunnel` packages are absent. Expo's MCP server requires `EXPO_UNSTABLE_MCP_SERVER` and these packages; it is disabled in this project. Generated command schema behavior is checked, but full MCP registration/schema-conversion/network behavior is unverified. Recheck it before enabling MCP; do not infer general Zod 4 compatibility for optional integrations.

The CLI's private `.d.ts` files also retain Zod 3 generic types. They are not imported by this app and are not generally type-compatible with Zod 4. Tools importing these CLI internals need a separate migration; the override's compatibility claim is limited to this project's exercised CLI runtime paths.

## Residual node-forge risk

The installed RSA verifier checks the outer DigestInfo count, but not the nested DigestAlgorithm count described by the advisory. Expo's signing helper reaches it through `certificate.verify(certificate)` and `certificate.publicKey.verify(...)` when validating a configured certificate or checking its own generated manifest signature. The helper also verifies CSRs when creating development certificates. This is real signing-tool code, not a test-only dependency.

Current `app.config.ts` has no `updates.codeSigningCertificate`, code-signing metadata or EAS project ID; `expo-updates` is not installed. The CLI returns no project signing info without that configuration. The development manifest middleware is network-reachable when a dev server is exposed, but the inspected path signs its own manifest/checks configured local material; a remotely supplied arbitrary signature was not found on this path. That limits demonstrated reachability and does not make node-forge safe for untrusted certificate/signature input. Its generated keys default to exponent 65537; imported keys are not thereby protected.

The app's `secureRandom.ts` uses `expo-crypto@58.0.7`, which calls Android `java.security.SecureRandom` and iOS `SecRandomCopyBytes`; it does not call forge's RSA verifier. Native Android APK signing and EAS Update manifest signing are separate operations. No crypto implementation is patched here.

Use trusted signing certificates/keys and plugins. Prefer USB/emulator development with `npm start -- --localhost` (USB devices also need the usual adb reverse setup); use LAN only on a trusted network, and avoid public tunnels/port forwarding. These reduce exposure, not the underlying defect. Reassess before enabling EAS Update/signing, accepting external certificates/CSRs, adding runtime forge/Zod usage, or changing Expo CLI. Track [upstream forge PR #1152](https://github.com/digitalbazaar/forge/pull/1152); no unreleased patch is vendored. Next advisory/release recheck: **2026-11-02**, or earlier if a fixed release lands.

## Installation and verification

The managed shell's one bounded registry check failed with `EAI_AGAIN`. Offline installation failed with `ENOTCACHED` for React metadata before changing the lockfile. The existing lock already has `react@19.3.0` and `react-dom@19.3.1`, whose peer requires `react@^19.3.1`; `npm ls react react-dom --all --json` reports `ELSPROBLEMS`. This preexisting peer mismatch is separate from the Zod advisory and is not silently repaired or bypassed.

The network-enabled host must resolve the prepared override using npm, review the actual lock diff, and save a fresh audit:

```sh
npm install --fetch-retries=0 --fetch-timeout=10000
npm audit --json > docs/security/npm-audit-after.json
npm run test:security
```

Audit may exit nonzero for the unresolved forge finding; retain the report. No `--force`, Expo 54 downgrade, fabricated lockfile, audit suppression or custom signature fix is used. Post-install checks, clean installation and the Android bundle/native smoke status are recorded in the iteration report; do not treat the baseline or compatibility experiment as a post-remediation audit.
