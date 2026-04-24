# Release Scripts

## release.sh

Automates the version bump and release process for userscripts.

### Usage

```bash
./scripts/release.sh
```

The script will:
1. Check for uncommitted changes (requires clean working directory)
2. Show available userscripts with current versions
3. Let you select which script(s) to release
4. Let you choose bump type (major/minor/patch)
5. Update version numbers in meta.js files
6. Rebuild dist/ files
7. Commit everything with appropriate message

### Example

```
$ ./scripts/release.sh

Available userscripts:

  1. fedex-form-filler (v0.2.4)
  2. snow (v0.1.0)
  3. shadow-query-console (v0.1.0)

Which script(s) to release? (comma-separated numbers, or 'all'): 1

Bump type:
  1. patch (0.0.X) - Bug fixes, small changes
  2. minor (0.X.0) - New features, non-breaking
  3. major (X.0.0) - Breaking changes

Select bump type [1-3]: 1

Releasing:
  - fedex-form-filler: v0.2.4 → v0.2.5

Proceed? [y/N]: y
```

### Version Bumping Guide

- **patch** (0.0.X): Bug fixes, typos, small tweaks
- **minor** (0.X.0): New features, improvements (backward compatible)
- **major** (X.0.0): Breaking changes, major rewrites

### After Release

```bash
# Review the commit
git show

# Push to remote
git push
```
