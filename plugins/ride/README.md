# Ambient Ride — Claude Code plugin

This is the production Claude Code plugin for the `ride` skill. It lets Claude
book and pay for TADA/Throo rides, manage the agent wallet, chat with the
driver, and tip.

## Install

```bash
claude plugin marketplace add mvlchain/ambient-ride-plugin
claude plugin install ride@ambient-ride
```

Then, in any project:

```text
/ride:setup
```

Installing a plugin only copies files, so nothing runs until you ask it to.
`/ride:setup` installs the public npm `@ambprotocol/ride-cli` package and the
`amb` executable used by the skill. The command wraps the skill's idempotent
installer and is safe to run again.

You can skip setup and mention a ride instead; the skill installs the CLI on
first load.

## Requirements and permissions

- Node.js 22.22.0 or newer is required.
- Claude Code 2.1.129 or newer is recommended. The bundled skill declares an
  `allowed-tools` rule containing `${CLAUDE_SKILL_DIR}`. Older versions may
  leave that token unresolved and prompt for each command, but the plugin still
  works after approval.
- The first time the skill loads in a session, Claude Code asks you to approve
  it. The `allowed-tools` declaration is a prompt exemption, so after approval
  the bundled setup and relay scripts and `amb` commands can run without
  repeated prompts during that turn.
- Headless (`claude -p`) use must allowlist the `Skill` tool because nobody can
  answer the first-load approval prompt. Use `--allowedTools "Skill"` or an
  equivalent permission setting in automation.

Runtime state is stored under `~/.amb`. The skill's full README is bundled at
`skills/ride/README.md`.

## Updating

```bash
claude plugin update ride@ambient-ride
```

Restart Claude Code after updating so it loads the new bundle. Production
plugin releases use stable semantic versions from `SKILL.md`.

## Troubleshooting

If `/ride:setup` fails, the installer writes a single-line JSON error to stderr.
Recovery instructions for each code are in the **Install error codes** section
of `skills/ride/README.md`.

## Learn more

The bundled `skills/ride/README.md` and `skills/ride/SKILL.md` document the CLI,
account modes, state layout, and ride workflows.
