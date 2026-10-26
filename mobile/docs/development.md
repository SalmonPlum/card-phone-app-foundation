# Development setup and validation

## Current validation status

The npm registry is unavailable inside this managed session, so the minimal shell was initially authored from official SDK58 source. The user subsequently ran `npm install` in the normal terminal. Dependencies are now installed and the real `package-lock.json` is committed. The foundation checks passed, followed by native-preview checks: 71 Node tests, 20 Jest tests, TypeScript, lint with no warnings, deck validation, and an Android Metro export. The separate security regression is still pending the targeted Zod refresh. See [phase-one status](phase-one-status.md) for scope and evidence.

The user confirmed a baseline Android development build runs on the phone. New native motion visual/performance checks and Expo Doctor/online compatibility verification remain pending. Offline `expo install --check` exited successfully but warned its compatibility validation is unreliable without network access; that is not an online compatibility pass.

The shell test was authored before its source but only executed after installation; no historical behavioural RED is claimed for that test. Domain work has recorded test-first failures and passing implementations. Tests stay outside Expo Router's `src/app/` route tree. Node `v22.23.1` and npm `10.9.8` were used.

## Version provenance

Direct versions are exact in package.json; transitive resolution is recorded in the committed lockfile. Sources were inspected on 2026-10-26. No native package versions were chosen independently of Expo's compatibility map.

| Package set | Source versions |
| --- | --- |
| Expo | 58.0.17 |
| React / React DOM / React Native | 19.3.0 / 19.3.0 / 0.88.0 |
| Reanimated / Worklets | 4.7.1 / 0.13.0 |
| TypeScript / React types | 6.0.3 / 19.3.0 |
| Jest Expo / Jest / RNTL | 58.0.12 / 30.4.2 / 14.1.0 |

- [Official creation guidance](https://docs.expo.dev/more/create-expo/) recommends `npx create-expo-app@latest mobile --template default@sdk-58` during the SDK 58 transition. Do not run it over this existing source directory.
- [SDK 58 default template](https://github.com/expo/expo/blob/sdk-58/templates/expo-template-default/package.json) supplies the React, React Native, Reanimated, Worklets, TypeScript, and React types set.
- [Expo package source](https://github.com/expo/expo/blob/sdk-58/packages/expo/package.json) supplies Expo 58.0.17, Node engine support, and Node types 22.14.0.
- [SDK 58 native compatibility map](https://github.com/expo/expo/blob/sdk-58/packages/expo/bundledNativeModules.json) supplies exact patch minimums for Router, Crypto, Localization, dev-client, constants, linking, status bar, gesture handler, safe area, screens, Jest Expo, and ESLint config. Its Router entry is 58.0.26.
- [Jest Expo source](https://github.com/expo/expo/blob/sdk-58/packages/jest-expo/package.json) supplies its React Native Jest preset peer requirement and test-renderer 1.3.0. [RNTL source](https://github.com/callstack/react-native-testing-library/blob/main/package.json) supplies RNTL 14.1.0, Jest 30.4.2, and Jest types 30.0.0; its peer ranges admit this React/RN/test-renderer set. [Expo ESLint config source](https://github.com/expo/expo/blob/sdk-58/packages/eslint-config-expo/package.json) permits ESLint ^9.18.0 for development. This project pins [ESLint 9.39.1](https://github.com/eslint/eslint/blob/v9.39.1/package.json), which provides the `eslint/config` API used by Expo's flat config; pinning the old range minimum 9.18.0 would lack that API.
- [Router manual setup](https://docs.expo.dev/router/installation/) defines the minimal required Router dependency set and `expo-router/entry`. Optional native tabs/toolbar UI and web packages are not needed for this phone shell.
- [Expo Reanimated setup](https://docs.expo.dev/versions/latest/sdk/reanimated/) configures Worklets through `babel-preset-expo` automatically. No custom Babel recipe is added. [Expo unit testing](https://docs.expo.dev/develop/unit-testing/) uses the Jest Expo preset and async RNTL `render` API.
- [Localization configuration](https://docs.expo.dev/versions/latest/sdk/localization/) defines the supportedLocales config plugin. Both `cs` and `en` are declared for Android/iOS.

These sources establish a candidate compatible set. Registry availability and actual resolved compatibility must be verified by installation and Expo's checks.

## Install and check on a network-enabled host

The CLI Zod override is not yet reflected in the lockfile; its targeted refresh and security validation must finish before claiming clean-install reproducibility. Follow [security follow-up](security/follow-up.md) for the pending host command. After that gate is closed, run from `mobile/` for a fresh checkout:

```sh
npm ci
npm run test:domain
npm run validate:decks
npm test -- --runInBand
npm run typecheck
npm run lint
npx expo install --check
npx expo-doctor
```

Use `npm ci` for the existing lockfile. Dependency changes belong to the integrator; review any Expo-compatible update before changing package.json/lockfile. The saved audit findings are scheduled for the next iteration—see [security follow-up](security/follow-up.md). Do not run automatic major-version audit fixes.

`android:release` builds/installs the local release variant; production signing/store delivery is separate.

## Framework-free domain tests without downloads

Node 22's built-in TypeScript stripping and test runner allow domain work while npm access is unavailable:

```sh
npm run test:domain -- src/domain/__tests__/deck.node.test.ts
```

Without arguments, the test runner discovers all domain suites. Optional explicit test file arguments select a focused run. Name these suites `*.node.test.ts`, import `test` from `node:test` and assertions from `node:assert/strict`, use explicit `.ts` paths for local imports, and use `import type` for contracts. Jest ignores these suites. Built-in stripping does not typecheck, transpile TSX, resolve Expo path aliases, or support non-erasable TypeScript constructs. Keep domain code free of React Native types and APIs; deck asset keys are strings, and `src/decks/assets.ts` supplies the native asset registry.

## Android host prerequisites

The installed SDK is `/home/salmon/Android/Sdk` with platform `android-37.0`. Android Studio is `/usr/local/android-studio`, with JBR at `/usr/local/android-studio/jbr`. Both available Java installations report Java 25. [The SDK 58 Android template](https://github.com/expo/expo/blob/sdk-58/templates/expo-template-bare-minimum/android/gradle/wrapper/gradle-wrapper.properties) selects Gradle 9.4.1; [Gradle's compatibility matrix](https://docs.gradle.org/current/userguide/compatibility.html) supports running Gradle on Java 25 from 9.1 onward. This is source-level compatibility evidence; confirm the generated wrapper and complete Android plugin build on the host.

After dependency checks pass, run each command from a host terminal with an emulator running or a USB-debugging device connected:

```sh
env ANDROID_HOME=/home/salmon/Android/Sdk JAVA_HOME=/usr/local/android-studio/jbr PATH="/usr/local/android-studio/jbr/bin:/home/salmon/Android/Sdk/platform-tools:$PATH" adb devices
env ANDROID_HOME=/home/salmon/Android/Sdk JAVA_HOME=/usr/local/android-studio/jbr PATH="/usr/local/android-studio/jbr/bin:/home/salmon/Android/Sdk/platform-tools:$PATH" npm run android
env ANDROID_HOME=/home/salmon/Android/Sdk JAVA_HOME=/usr/local/android-studio/jbr PATH="/usr/local/android-studio/jbr/bin:/home/salmon/Android/Sdk/platform-tools:$PATH" npm run android:release
```

Expo generates ignored native directories on demand. Install any additional SDK Build Tools/NDK/CMake versions requested by the generated build and accept SDK licences on the host. The sandbox prevented adb from opening its tcp5037 daemon listener (`EPERM`), so no device/emulator connection or native launch is claimed. No user shell configuration was changed.
