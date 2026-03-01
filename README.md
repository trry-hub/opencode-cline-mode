# opencode-cline-mode

> Cline-style plan and act workflow for OpenCode - **Now with official Cline prompts!**

[![npm version](https://img.shields.io/npm/v/opencode-cline-mode.svg)](https://www.npmjs.com/package/opencode-cline-mode)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A plugin for [OpenCode](https://opencode.ai) that brings **authentic Cline experience** to your AI coding sessions by dynamically fetching prompts from the official Cline repository. Separate planning from execution for more controlled and predictable development.

## ✨ Features

- 🎯 **Official Cline Prompts** - Dynamically fetches the latest prompts from [cline/cline](https://github.com/cline/cline) repository
- 📦 **Plan Mode** - Analyze and create detailed implementation plans without making changes (pure read-only)
- ⚡ **Act Mode** - Execute approved plans step by step with progress tracking
- 🔄 **Automatic Tool Mapping** - Seamlessly converts Cline tool names to OpenCode equivalents
- 🛡️ **Smart Adaptation** - Removes unsupported features and provides alternatives
- 🚀 **Zero Config** - Works out of the box with sensible defaults
- 🔒 **Strict Permission Control** - Plan mode is truly read-only

### 🆕 What's New in v4.0

- **🎯 Official Cline Prompts**: Now uses complete official Cline prompts including system-prompt/index.ts
- **📝 Improved Plan Accuracy**: Plan mode now follows official Cline planning methodology exactly
- **🔧 Minimal Overrides**: Removed custom mode intros to let official prompts shine
- **✅ Better Integration**: Only adds minimal OpenCode-specific notes without overriding official behavior

### What's New in v3.0

- **Dynamic Prompt Fetching**: Automatically fetches the latest prompts from Cline's official GitHub repository on startup
- **Tool Name Mapping**: Intelligent conversion of Cline tool names (e.g., `read_file` → `read`)
- **MCP Removal**: Automatically removes MCP-related content not supported by OpenCode
- **Alternative Suggestions**: Provides OpenCode alternatives for unsupported Cline features
- **Startup Validation**: Ensures prompts are fetched successfully before plugin initialization

## 📦 Installation

### From npm (Recommended)

```bash
npm install -g opencode-cline-mode
```

Then add to your OpenCode config (`~/.config/opencode/opencode.json`):

```json
{
  "plugin": ["opencode-cline-mode"]
}
```

### From local files

Clone this repository and symlink to your OpenCode plugins directory:

```bash
git clone https://github.com/trry-hub/opencode-cline-mode.git
cd opencode-cline-mode
npm install
npm run build
ln -s $(pwd) ~/.config/opencode/plugins/opencode-cline-mode
```

**Important**: When using local installation via symlink, **do NOT** add `"opencode-cline-mode"` to the `plugin` array.

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

### Typical Workflow

1. **Start with Planning** (`cline-plan`):
   - Describe what you want to build
   - Review the detailed plan created by the AI
   - Ask for modifications if needed

2. **Switch to Execution** (`cline-act`):
   - Press `Tab` and select `cline-act`
   - The AI implements the plan step by step
   - Watch as changes are made to your codebase

## ⚙️ Configuration

### Optional Configuration File

Create `~/.config/opencode/opencode-cline-mode.json` or `.opencode/opencode-cline-mode.json` in your project:

```json
{
  "replace_default_agents": true,
  "default_agent": "cline-plan",
  "plan_model": null,
  "act_model": null,
  "plan_temperature": 0.1,
  "act_temperature": 0.3,
  "enable_execute_command": true
}
```

#### Configuration Options

| Option                   | Type    | Default        | Description                                  |
| ------------------------ | ------- | -------------- | -------------------------------------------- |
| `replace_default_agents` | boolean | `true`         | If `true`, removes OpenCode's default agents |
| `default_agent`          | string  | `"cline-plan"` | Which agent to use by default                |
| `plan_model`             | string  | `null`         | Model for cline-plan agent                   |
| `act_model`              | string  | `null`         | Model for cline-act agent                    |
| `plan_temperature`       | number  | `0.1`          | Temperature for plan mode (0-1)              |
| `act_temperature`        | number  | `0.3`          | Temperature for act mode (0-1)               |
| `enable_execute_command` | boolean | `true`         | Enable `/start-act` command                  |
| `show_completion_toast`  | boolean | `true`         | Show toast notification when plan completes  |

## 🔧 How It Works

### Startup Process

1. **Fetch Prompts**: On plugin initialization, fetches the latest prompt files from `cline/cline` repository
2. **Adapt Content**: Extracts prompt content from TypeScript files and adapts them for OpenCode
3. **Map Tools**: Converts Cline tool names to OpenCode equivalents using `config/tool-mapping.json`
4. **Remove Unsupported**: Removes MCP and other unsupported features
5. **Build Agents**: Creates `cline-plan` and `cline-act` agents with adapted prompts

### Tool Mapping

The plugin automatically maps Cline tool names to OpenCode equivalents:

| Cline Tool        | OpenCode Tool |
| ----------------- | ------------- |
| `read_file`       | `read`        |
| `write_to_file`   | `write`       |
| `list_files`      | `glob`        |
| `search_files`    | `grep`        |
| `replace_in_file` | `edit`        |
| `execute_command` | `bash`        |

### Unsupported Features

Some Cline features are not available in OpenCode. The plugin provides alternatives:

| Cline Feature           | Alternative                                 |
| ----------------------- | ------------------------------------------- |
| `browser_action`        | Use `remote-browser` or `browser-use` skill |
| `ask_followup_question` | AI asks directly in response                |

## 🛡️ Error Handling

If the plugin cannot fetch prompts from GitHub (network issues, rate limits, etc.), it will:

1. Display a clear error message with the specific issue
2. Provide troubleshooting steps
3. **Fail to start** - ensuring you're aware of the problem

This strict approach ensures you always use the latest official Cline prompts.

## 📖 Example Error Message

```
╔═══════════════════════════════════════════════════════════════╗
║  Cline Mode Plugin - Failed to Fetch Prompts                  ║
╠═══════════════════════════════════════════════════════════════╣
║  The plugin could not fetch prompts from Cline's official     ║
║  GitHub repository.                                           ║
║                                                               ║
║  Error: Network timeout                                       ║
║                                                               ║
║  Solutions:                                                   ║
║  1. Check your internet connection                            ║
║  2. Try again in a few minutes                                ║
║  3. If rate limited, wait until the reset time                ║
║  4. Check GitHub's status: https://status.github.com          ║
╚═══════════════════════════════════════════════════════════════╝
```

## 🔧 Development

### Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- Internet connection (for fetching prompts)

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
npm run typecheck        # Type checking
npm run lint             # Linting
npm run validate         # Full validation
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
│   ├── prompt-fetcher.ts     # GitHub prompt fetcher
│   ├── prompt-adapter.ts     # Prompt adaptation
│   ├── tool-mapper.ts        # Tool name mapping
│   └── utils/
│       ├── github-api.ts     # GitHub API client
│       └── cache.ts          # Prompt caching
├── config/
│   └── tool-mapping.json     # Tool mapping configuration
├── dist/                     # Compiled output
└── package.json
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT © [trry](https://github.com/trry)

## 🙏 Acknowledgments

- Prompts from [Cline](https://github.com/cline/cline) - The official Cline VS Code extension
- Built for [OpenCode](https://opencode.ai) - The open source AI coding agent
- Thanks to the OpenCode and Cline communities

## 📚 Related Projects

- [Cline](https://github.com/cline/cline) - The original Cline VS Code extension
- [OpenCode](https://opencode.ai) - The open source AI coding agent
- [awesome-opencode](https://github.com/awesome-opencode/awesome-opencode) - Curated list of OpenCode resources

## 🐛 Issues

Found a bug? Have a feature request? Please [open an issue](https://github.com/trry-hub/opencode-cline-mode/issues).

---

**Made with ❤️ for the OpenCode community**
