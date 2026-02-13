# Getting Started

Quick start guide for OpenCode Cline Mode Plugin.

## Prerequisites

- OpenCode AI installed (`opencode`)
- Node.js 18+
- npm or yarn

## Installation

### From npm (Recommended)

```bash
npm install -g opencode-cline-mode
```

Add to your OpenCode config (`~/.config/opencode/opencode.json`):

```json
{
  "plugin": ["opencode-cline-mode"]
}
```

### From Source

```bash
git clone https://github.com/trry-hub/opencode-cline-mode.git
ln -s $(pwd)/opencode-cline-mode ~/.config/opencode/plugins/opencode-cline-mode
```

**Note**: When using symlink, do NOT add to `plugin` array. OpenCode auto-loads from plugins directory.

## Verify Installation

```bash
cd /path/to/opencode-cline-mode
./verify-setup.sh
```

## Quick Start

1. **Start OpenCode**
   ```bash
   cd /path/to/your/project
   opencode
   ```

2. **Check Agents**
   - Press `Tab` key
   - You should see:
     - `cline-plan` (default)
     - `cline-act`

3. **Plan Mode** (default)
   ```
   Describe your feature or task...
   ```
   - AI analyzes and creates a detailed plan
   - No code changes are made

4. **Switch to Act Mode**
   - Press `Tab` → select `cline-act`
   - Or type: `/agent cline-act`
   - Or type: `execute`

5. **Execute Plan**
   - AI implements the plan step by step
   - Modifies code, runs tests, verifies results

## Next Steps

- [Configuration Guide](configuration.md) - Customize plugin behavior
- [Usage Guide](usage.md) - Detailed workflow examples
- [Troubleshooting](troubleshooting.md) - Common issues and solutions

## Quick Reference

| Action | Command/Key |
|--------|-------------|
| Switch to Plan Mode | `Tab` → `cline-plan` or `/agent cline-plan` |
| Switch to Act Mode | `Tab` → `cline-act` or `/agent cline-act` |
| Quick execute | Type `execute` or `执行` |
| Quick replan | Type `replan` or `重新规划` |
| Verify setup | `./verify-setup.sh` |
| Disable plugin | `./disable-plugin.sh` |
| Enable plugin | `./enable-plugin.sh` |
