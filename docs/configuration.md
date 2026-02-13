# Configuration Guide

Complete guide to configuring OpenCode Cline Mode Plugin.

## Configuration File

Create a configuration file at one of these locations:

- Project-level: `.opencode/opencode-cline-mode.json`
- User-level: `~/.config/opencode/opencode-cline-mode.json`

### Basic Configuration

```json
{
  "$schema": "https://raw.githubusercontent.com/trry-hub/opencode-cline-mode/main/opencode-cline-mode.schema.json",
  "replace_default_agents": true,
  "default_agent": "cline-plan"
}
```

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `replace_default_agents` | boolean | `true` | Hide OpenCode's default agents (build, plan, etc.) |
| `default_agent` | string | `"cline-plan"` | Default agent to use |
| `plan_model` | string | `null` | Model for cline-plan (null = inherit from opencode.json) |
| `act_model` | string | `null` | Model for cline-act (null = inherit from opencode.json) |
| `plan_temperature` | number | `0.1` | Temperature for plan mode (lower = more focused) |
| `act_temperature` | number | `0.3` | Temperature for act mode |

## Common Configurations

### Keep Default Agents

Use Cline agents alongside OpenCode's default agents:

```json
{
  "replace_default_agents": false,
  "default_agent": "cline-plan"
}
```

This will show all agents:
- `cline-plan`
- `cline-act`
- `plan` (OpenCode default)
- `build` (OpenCode default)
- etc.

### Use Different Models

Use different AI models for planning and execution:

```json
{
  "replace_default_agents": true,
  "default_agent": "cline-plan",
  "plan_model": "anthropic/claude-opus-4",
  "act_model": "anthropic/claude-sonnet-4"
}
```

### Adjust Temperature

Fine-tune AI behavior with temperature settings:

```json
{
  "plan_temperature": 0.05,
  "act_temperature": 0.2
}
```

**Temperature Guide**:
- `0.0 - 0.1`: Very focused, deterministic (recommended for planning)
- `0.2 - 0.4`: Balanced (recommended for execution)
- `0.5 - 1.0`: More creative, varied responses

## Hiding Native Agents

When `replace_default_agents: true`, the plugin hides OpenCode's native agents by:

1. Setting `mode: "subagent"` - Demotes from primary
2. Setting `hidden: true` - Hides from UI

The native agents are still available via `@build` or `@plan` syntax.

### Manual Override

To manually control agent visibility, edit `~/.config/opencode/opencode.json`:

```json
{
  "agent": {
    "build": {
      "mode": "subagent",
      "hidden": true
    },
    "plan": {
      "mode": "subagent",
      "hidden": true
    }
  },
  "default_agent": "cline-plan"
}
```

## Managing the Plugin

### Enable Plugin

```bash
cd /path/to/opencode-cline-mode
./enable-plugin.sh
```

### Disable Plugin

```bash
./disable-plugin.sh
```

Disabling restores OpenCode's default agent configuration.

### Verify Setup

```bash
./verify-setup.sh
```

## Configuration Schema

JSON Schema is available for IDE validation:

```json
{
  "$schema": "https://raw.githubusercontent.com/trry-hub/opencode-cline-mode/main/opencode-cline-mode.schema.json"
}
```

## Next Steps

- [Usage Guide](usage.md) - Learn the complete workflow
- [Troubleshooting](troubleshooting.md) - Fix configuration issues
