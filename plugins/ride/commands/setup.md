---
description: Install or repair the Ambient Ride CLI on this machine
allowed-tools: Bash(node ${CLAUDE_PLUGIN_ROOT}/skills/ride/scripts/install.js)
---

Install the `amb` CLI and initialize its `~/.amb` state directory.

1. Run the installer. It is idempotent — running it again is always safe, and it
   reports `status: already_installed` when there is nothing to do:

```bash
node "${CLAUDE_PLUGIN_ROOT}/skills/ride/scripts/install.js"
```

Do **not** try to short-circuit this by checking `which amb` first. A `amb` on
PATH does not mean the machine is set up: it may be an older build, a different
channel, a PATH-shadowed binary, or a working binary whose state directory and
passphrase were never initialized. Verifying all of that is exactly what the
installer does — skipping it would report success over a broken setup.

2. On failure the installer writes a single-line JSON to stderr:
   `{"error":"<CODE>","message":"..."}`. Map the code to its recovery action and
   tell the user what to do. The six codes are `SSH_KEY_MISSING`,
   `SYMLINK_FAILED`, `PATH_MISSING`, `SHA_MISMATCH`, `VERSION_MISMATCH` and
   `AMB_INSTALL_FAILED`; the per-code recovery steps are in the
   **Install error codes** section of
   `${CLAUDE_PLUGIN_ROOT}/skills/ride/README.md`. Say that re-running this
   command after fixing the cause is safe.

3. On success, show the installer's stdout verbatim — it reports `status`,
   the state directory, and the next steps the user should take.
