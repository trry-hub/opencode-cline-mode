# opencode-cline-mode

> Cline-style plan and act workflow for OpenCode

[![npm version](https://img.shields.io/npm/v/opencode-cline-mode.svg)](https://www.npmjs.com/package/opencode-cline-mode)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A plugin for [OpenCode](https://opencode.ai) that brings Cline-style structured workflow to your AI coding sessions. Separate planning from execution for more controlled and predictable development.

## ✨ Features

- 🎯 **Plan Mode** - Analyze and create detailed implementation plans without making changes
- ⚡ **Act Mode** - Execute approved plans step by step with progress tracking
- 🔗 **Automatic Plan Inheritance** - Plans are automatically passed from plan mode to act mode (no copy-paste needed!)
- 🔄 **Clean Agent List** - Only shows `cline-plan` and `cline-act`, removes default agents
- 📝 **Structured Output** - Clear, actionable plans with risk assessment and verification steps
- 🚀 **Quick Execute Command** - Type `/start-act` to quickly switch from plan to act mode
- 🌐 **Dynamic Cline Integration** - Fetch latest prompts from Cline's official repository (NEW in v2.0!)
- 💾 **Smart Caching** - Cache prompts locally to reduce network requests (NEW in v2.0!)
- 🔧 **Flexible Configuration** - Choose between local, GitHub, or auto mode (NEW in v2.0!)
- 🎨 **Zero Config** - Works out of the box with sensible defaults

### 🔒 Permission Control

**cline-plan** (Read-Only):
- ✅ Read files
- ✅ Search codebase
- ❌ Edit files (denied)
- ❌ Execute bash commands (denied)

**cline-act** (Full Access):
- ✅ Edit files (allowed)
- ⚠️ Execute bash commands (asks for permission)
- ✅ All other tools

**Note**: When `replace_default_agents: true` (default), OpenCode's default agents (plan, build, etc.) are **completely removed** from the agent list. You will only see `cline-plan` and `cline-act` agents. This ensures a focused Cline-style workflow without any confusion.

This ensures you can safely plan without accidentally modifying code.

## 📦 Installation

### From npm (Recommended)

```bash
npm install -g opencode-cline-mode
```

Then add to your OpenCode config:

```json
{
  "plugin": ["opencode-cline-mode"]
}
```

### From local files

Clone this repository and symlink to your OpenCode plugins directory:

```bash
git clone https://github.com/trry-hub/opencode-cline-mode.git
ln -s $(pwd)/opencode-cline-mode ~/.config/opencode/plugins/opencode-cline-mode
```

**Important**: When using local installation via symlink, **do NOT** add `"opencode-cline-mode"` to the `plugin` array in `opencode.json`. OpenCode automatically loads plugins from the `~/.config/opencode/plugins/` directory.

❌ **Wrong** (will cause installation error):
```json
{
  "plugin": ["opencode-cline-mode"]
}
```

✅ **Correct** (no plugin array entry needed):
```json
{
  "plugin": []
}
```

The plugin will be loaded automatically from the symlink.

## 🚀 Usage

This plugin registers two independent agents in OpenCode:

### 1. `cline-plan` Agent - Planning Mode

Start a new session with the plan agent:

```bash
opencode --agent cline-plan
```

Or switch to it in TUI by pressing `Tab` and selecting `cline-plan`.

In plan mode, the AI will:
- ✅ Analyze your codebase
- ✅ Create detailed step-by-step plans
- ✅ Assess risks and suggest alternatives
- ❌ NOT make any code changes
- ❌ NOT execute any commands

### 2. `cline-act` Agent - Execution Mode

Start a new session with the act agent:

```bash
opencode --agent cline-act
```

Or switch to it in TUI by pressing `Tab` and selecting `cline-act`.

In act mode, the AI will:
- ✅ Execute plans step by step
- ✅ Make code changes as specified
- ✅ Run verification commands
- ✅ Report progress after each step
- ⚠️ Stop and ask for guidance on errors

### Switching Between Agents

In the OpenCode TUI:
1. Press `Tab` to see available agents
2. You will **only** see:
   - `cline-plan` - Planning mode
   - `cline-act` - Execution mode
3. Select the agent you want to use
4. **New in v1.2.0**: When switching from `cline-plan` to `cline-act`, your plan is **automatically inherited** - no need to copy and paste!

### Plan Approval Workflow

When `enable_plan_approval` is enabled (default), plans must be approved before execution:

1. Create a plan using `cline-plan` agent
2. Review the plan
3. Approve it: `/approve-plan`
4. Execute it: `/start-act`

Available commands:
- `/approve-plan` - Approve the current plan
- `/reject-plan` - Reject the current plan with optional reason
- `/start-act` - Switch to execution mode (requires approval if enabled)

To disable approval workflow:
```json
{
  "enable_plan_approval": false
}
```

### Typical Workflow

1. **Start with Planning** (`cline-plan`):
   - Describe what you want to build
   - Review the detailed plan created by the AI
   - Approve or request modifications

2. **Switch to Execution** (`cline-act`):
   - Press `Tab` and select `cline-act`
   - The plan is automatically passed to the execution agent
   - Watch as the AI implements the plan step by step
   - Approve each change or provide feedback

**Note**: This plugin **completely replaces** OpenCode's default agents (plan, build, etc.) to provide a focused Cline-style workflow. The default agents are removed from the agent list, ensuring only `cline-plan` and `cline-act` are available. If you want to use default agents alongside Cline agents, see [Configuration](#configuration) below.

---

## ⚙️ Configuration

### Optional Configuration File

Create `~/.config/opencode/opencode-cline-mode.json` or `.opencode/opencode-cline-mode.json` in your project:

```json
{
  "replace_default_agents": true,
  "default_agent": "cline-plan",
  "plan_model": null,
  "act_model": null
}
```

#### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `replace_default_agents` | boolean | `true` | If `true`, removes OpenCode's default agents. If `false`, adds Cline agents alongside defaults. |
| `default_agent` | string | `"cline-plan"` | Which agent to use by default (`"cline-plan"` or `"cline-act"`) |
| `plan_model` | string | `null` | Model for cline-plan agent. If `null`, uses default model from `opencode.json` |
| `act_model` | string | `null` | Model for cline-act agent. If `null`, uses default model from `opencode.json` |
| `plan_temperature` | number | `0.1` | Temperature for plan mode (lower = more focused, 0-1) |
| `act_temperature` | number | `0.3` | Temperature for act mode (0-1) |
| `show_completion_toast` | boolean | `true` | Show toast notification when plan is complete |
| `enable_execute_command` | boolean | `true` | Enable `/start-act` command for quick switching from plan to act mode |
| `enable_plan_approval` | boolean | `true` | Enable plan approval workflow. Plans must be approved using `/approve-plan` before execution |
| `prompt_source` | string | `"auto"` | Prompt source: `"local"` (use local files), `"github"` (fetch from Cline repo), `"auto"` (cache → github → local) |
| `cline_version` | string | `"latest"` | Cline version to use: `"latest"` or specific version/branch (e.g., `"main"`, `"v1.2.3"`) |
| `cache_ttl` | number | `24` | Cache time-to-live in hours |
| `fallback_to_local` | boolean | `true` | Fallback to local prompts if GitHub fetch fails |

#### Example: Keep Default Agents

If you want to use Cline agents **alongside** OpenCode's default agents:

```json
{
  "replace_default_agents": false
}
```

Then you'll see all agents when pressing `Tab`:
- `cline-plan`
- `cline-act`
- `plan` (OpenCode default)
- `build` (OpenCode default)
- etc.

#### Example: Use Different Models

```json
{
  "replace_default_agents": true,
  "plan_model": "anthropic/claude-opus-4",
  "act_model": "anthropic/claude-sonnet-4"
}
```

#### Example: Use Latest Cline Prompts from GitHub

```json
{
  "prompt_source": "github",
  "cline_version": "latest",
  "cache_ttl": 24,
  "fallback_to_local": true
}
```

This will:
- Fetch the latest prompts from Cline's GitHub repository
- Cache them for 24 hours
- Automatically fall back to local prompts if GitHub is unavailable

#### Example: Use Specific Cline Version

```json
{
  "prompt_source": "github",
  "cline_version": "main",
  "cache_ttl": 168
}
```

This will use prompts from Cline's `main` branch and cache for 7 days (168 hours).

#### Example: Always Use Local Prompts

```json
{
  "prompt_source": "local"
}
```

This disables GitHub fetching and always uses the local prompt files.

### 🌐 Prompt Source Modes

The plugin supports three prompt source modes:

1. **`local`** - Always use local prompt files (fastest, no network required)
2. **`github`** - Always fetch from Cline's GitHub repository (always up-to-date)
3. **`auto`** (default) - Smart mode: cache → github → local
   - First checks cache
   - If cache expired, fetches from GitHub
   - If GitHub fails, falls back to local

**Recommendation**: Use `auto` mode for the best balance of performance and freshness.

### 🚀 Quick Execute Command

After planning is complete, you'll see a prompt with options:

**📋 Plan Complete!**

✅ **Quick Execute**: Use `/start-act` **tool** to switch to `cline-act`
✏️ **Modify**: Tell me which step to change
❌ **Cancel**: Type "cancel" to abort

**Important**: Use the `/start-act` **tool** (not a command) by:
- Typing `/start-act` in chat
- Or pressing Tab and typing `/start-act`

#### Example: Disable Quick Command

If you prefer not to have the `/start-act` command:

```json
{
  "enable_execute_command": false
}
```

## 📖 Example Workflow

```bash
# 1. Start with planning (default mode)
opencode

# Describe your feature:
# "Add soft delete functionality to the notes system"

# AI creates a detailed plan with:
# - Impact scope (files to modify/create)
# - Step-by-step implementation
# - Risk assessment
# - Verification steps

# 2. Review the plan, ask questions, iterate
# "Can you also add a trash view to show deleted notes?"

# 3. Once satisfied, switch to act mode
# Press Tab, select cline-act

# 4. Execute the plan
# AI executes step by step:
# ✅ Step 1/8: Update Note Model
# ✅ Step 2/8: Create Database Migration
# ✅ Step 3/8: Modify Delete API
# ...
```

## 🎨 Plan Mode Output Format

Plans include:

- **📊 Overview** - What will be done and why
- **📁 Impact Scope** - Files modified/created/deleted
- **📝 Detailed Plan** - Step-by-step implementation
- **⚠️ Risk Warnings** - Potential issues and mitigation
- **🔄 Alternative Approaches** - Different implementation options

## ⚡ Act Mode Execution

Execution includes:

- **Progress Tracking** - Clear indication of current step
- **Verification** - Automatic verification after each step
- **Error Handling** - Stops on errors with suggested solutions
- **Rollback Support** - Can undo changes if needed

## 🔧 Development

### Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0

### Setup

```bash
git clone https://github.com/trry-hub/opencode-cline-mode.git
cd opencode-cline-mode
npm install
```

### Build

```bash
npm run build
```

### Test

```bash
npm test                 # Run tests
npm run test:watch       # Watch mode
npm run test:coverage    # With coverage
```

### Project Structure

```
opencode-cline-mode/
├── src/
│   ├── index.ts              # Main plugin entry
│   ├── types.ts              # TypeScript definitions
│   ├── logger.ts             # Unified logging
│   ├── config-validator.ts   # Config validation
│   ├── config-loader.ts      # Config loading
│   ├── path-resolver.ts      # Path resolution
│   ├── agent-builder.ts      # Agent configuration
│   └── message-transformer.ts # Message processing
├── prompts/
│   ├── plan.md               # Plan mode prompt
│   └── act.md                # Act mode prompt
├── dist/                     # Compiled output
├── docs/                     # Documentation
└── package.json
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

MIT © [trry](https://github.com/trry)

## 🙏 Acknowledgments

- Inspired by [Cline](https://github.com/cline/cline) workflow
- Built for [OpenCode](https://opencode.ai)
- Thanks to the OpenCode community

## 📚 Documentation

For detailed information, please visit:
- [GitHub Repository](https://github.com/trry-hub/opencode-cline-mode)
- [Issue Tracker](https://github.com/trry-hub/opencode-cline-mode/issues)
- [Changelog](CHANGELOG.md)
- [npm Package](https://www.npmjs.com/package/opencode-cline-mode)

## 📚 Related Projects

- [OpenCode](https://opencode.ai) - The open source AI coding agent
- [oh-my-opencode](https://github.com/code-yeongyu/oh-my-opencode) - Advanced OpenCode plugin harness
- [awesome-opencode](https://github.com/awesome-opencode/awesome-opencode) - Curated list of OpenCode resources

## 🐛 Issues

Found a bug? Have a feature request? Please [open an issue](https://github.com/trry-hub/opencode-cline-mode/issues).

## 📮 Contact

- GitHub: [@trry](https://github.com/trry)
- Issues: [GitHub Issues](https://github.com/trry-hub/opencode-cline-mode/issues)

---

**Made with ❤️ for the OpenCode community**
