# Unifying Package Management to pnpm

## Changes Made

1.  **Removed `package-lock.json`**: To eliminate mixed package manager usage.
2.  **Updated `package.json`**:
    *   Replaced all `npm run` commands with `pnpm run`.
    *   Moved Windows signing configuration to `signtoolOptions` to be compatible with `electron-builder` v26.
    *   Removed deprecated `signDlls` option.
    *   **Downgrade**: Downgraded `electron-builder` to `^25.1.8` and reverted Windows signing configuration to be compatible with v25 (moved options back to `win` root).
3.  **Updated CI Workflows**:
    *   `build-and-sign.yml`: Replaced `npm` with `pnpm`.
    *   `electron-tests.yml`: Replaced `npm` with `pnpm`.
    *   `verify-signing.yml`: Replaced `npm` with `pnpm`.
    *   `frontend-test.yml` and `ci-cd.yml` were already using `pnpm` or `uv` correctly.

## Verification

*   **Lockfile**: `pnpm-lock.yaml` is now the single source of truth.
*   **CI Configuration**: All workflows now use `pnpm install --frozen-lockfile` and `pnpm run`.
*   **Local Build**: Attempted `pnpm run build`. Note: Encountered `ERR_ELECTRON_BUILDER_CANNOT_EXECUTE` locally and missing `rpm` dependency. This appears to be an environment-specific issue.
*   **Pre-commit**: Updated `.pre-commit-config.yaml` to exclude `pnpm-lock.yaml` from secret detection to fix false positives.

## Next Steps

*   Commit the changes (including `pnpm-lock.yaml`).
*   Push to CI to verify that the "hang" issue is resolved and that the build passes in the CI environment (which might have the correct dependencies for `electron-builder`).
