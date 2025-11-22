# Downgrade electron-builder to v25

## Goal Description
Downgrade `electron-builder` from v26 to v25 due to reported instability. Revert configuration changes in `package.json` that were made to accommodate v26.

## Proposed Changes

### Configuration
#### [MODIFY] [package.json](file:///home/hiro/workspace/IconConverter/package.json)
- Change `devDependencies` `electron-builder` version from `^26.0.0` to `^25.1.8` (or latest v25).
- Revert `win` configuration:
    - Move `certificateSubjectName`, `signingHashAlgorithms`, and `rfc3161TimeStampServer` from `signtoolOptions` back to `win` root.
    - Restore `signDlls: true`.

## Verification Plan

### Automated Tests
- Run `pnpm install` to update dependencies.
- Run `pnpm run build` to verify the build process works with v25.
- Run `pnpm run test:unit` to ensure no regressions.
