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
- 🚀 **Quick Execute Command** - Type `/execute-plan` to quickly switch from plan to act mode (NEW!)
- 🎨 **Zero Config** - Works out of the box with sensible defaults
- 📦 **Similar to oh-my-opencode** - Replaces default agents for a focused workflow

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

**Note**: This plugin **replaces** OpenCode's default agents (plan, build, etc.) to provide a focused Cline-style workflow. If you want to use default agents alongside Cline agents, see [Configuration](#configuration) below.

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
| `enable_execute_command` | boolean | `true` | Enable `/execute-plan` command for quick switching from plan to act mode |

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

### 🚀 Quick Execute Command

After planning is complete, you'll see a prompt with options:

**📋 Plan Complete!**

✅ **Quick Execute**: Use `/execute-plan` **tool** to switch to `cline-act`
✏️ **Modify**: Tell me which step to change
❌ **Cancel**: Type "cancel" to abort

**Important**: Use the `/execute-plan` **tool** (not a command) by:
- Typing `/execute-plan` in chat
- Or pressing Tab and typing `/execute-plan`

#### Example: Disable Quick Command

If you prefer not to have the `/execute-plan` command:

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
