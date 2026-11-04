# WleeSend implementation rules

## Required review before implementation

Before changing or generating implementation code:

1. Read this file and the root `AGENTS.md` in full.
2. Inspect the relevant routes, components, services, types, and their callers before deciding how to change them.
3. Check the current worktree and existing changes in files you may touch. Preserve unrelated and uncommitted work.
4. Confirm the expected behavior and how the change will be validated. If the requirements conflict or leave a consequential behavior unclear, ask before choosing.

Do not begin implementation until this review is complete. Recheck these rules at the start of every new implementation task.

## Project architecture

- This is a TypeScript, Expo, React Native app using Expo Router. Keep route screens in `src/app/`; route-group folders such as `(auth)` and `(tabs)` organize routes, and `_layout.tsx` files define navigation layouts.
- Keep route files focused on screen composition. Put reusable UI in `src/components/`; do not put non-route components, hooks, or utilities in `src/app/`.
- Keep API operations in `src/services/`. Use the shared API layer in `src/api/` and define endpoint URLs in `src/config/api.ts`; do not add one-off `fetch` calls in screens.
- Put shared domain and API payload/response types in `src/types/` or the existing API type modules in `src/api/`. Keep a type local when it is only used by one component and does not belong to a shared contract.
- `src/store.tsx` owns the current app-wide send and authentication state. Keep screens and services consistent with it; do not assume draft or transaction data is persisted or backed by the server.
- Use `src/theme.ts` for shared light/dark palette values and `src/data.ts` for the existing static operator, package, and fee data. Avoid duplicating these values in screens.
- Use the existing `@/` TypeScript path alias for imports from `src/`.

## API and account handling

- Use `apiClient` from `src/api/client.ts` for new service requests, and use the endpoint constants in `src/config/api.ts`. The client currently supports `GET`, `POST`, `PATCH`, and `DELETE`, plus its generic `request` method; it does not currently expose `PUT`. If a feature needs `PUT`, add it consistently to the shared API method type and client rather than bypassing the shared layer.
- Reuse existing service functions and types when extending auth or account flows. Keep request/response contracts explicit and handle unsuccessful responses and thrown errors visibly; do not turn failures into success-shaped defaults or silently swallow them.
- Treat all `EXPO_PUBLIC_*` values as public app-bundle configuration. Never place credentials or private secrets there.
- Follow the existing auth-session integration for sign-in state and platform-specific persistence. Do not introduce a second token-storage mechanism.

## Expo, mobile, and dependencies

- Check `package.json` before relying on an Expo or React Native API. This project uses Expo SDK 58; for Expo API changes, consult the matching versioned docs at `https://docs.expo.dev/versions/v58.0.0/` and the relevant official page before coding.
- Design and validate UI for phones on both iOS and Android, and preserve web behavior where a platform-specific implementation exists. Account for safe areas, keyboard interaction, loading/error states, and usable touch targets.
- The project uses npm (`package-lock.json`; no Bun lockfile). Use `npm` scripts for project commands and `npx expo install <package>` for Expo-compatible dependency versions.
- `android/` exists and `ios/` does not. Do not create native project files by hand. Prefer `app.json` and config plugins for Expo-managed native configuration; only edit native project files when the task specifically requires it, and avoid destructive regeneration.

## Validation

- Run `npm run lint` and `npx tsc --noEmit` after implementation changes. The project currently has no test script; run relevant tests if a test setup is added or the change provides a targeted test.
- For dependency or Expo configuration changes, also run `npx expo-doctor`. For native-module changes, state whether a development build is required.
- Report commands that could not be run and their reason; do not claim validation that was not performed.
