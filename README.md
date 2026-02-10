# opencode-cline-mode

> Cline-style plan and act workflow for OpenCode

[![npm version](https://img.shields.io/npm/v/opencode-cline-mode.svg)](https://www.npmjs.com/package/opencode-cline-mode)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A plugin for [OpenCode](https://opencode.ai) that brings Cline-style structured workflow to your AI coding sessions. Separate planning from execution for more controlled and predictable development.

## ✨ Features

- 🎯 **Plan Mode** - Analyze and create detailed implementation plans without making changes
- ⚡ **Act Mode** - Execute approved plans step by step with progress tracking
- 🔄 **Session Management** - Seamlessly switch between modes within a session
- 📝 **Structured Output** - Clear, actionable plans with risk assessment and verification steps
- 🚀 **Zero Config** - Works out of the box with sensible defaults

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
git clone https://github.com/trry/opencode-cline-mode.git
ln -s $(pwd)/opencode-cline-mode ~/.config/opencode/plugins/opencode-cline-mode
```

## 🚀 Usage

### Plan Mode

Enter plan mode to analyze requirements and create implementation plans:

```bash
/cline-plan I want to add user authentication with JWT tokens
```

In plan mode, the AI will:
- ✅ Analyze your codebase
- ✅ Create detailed step-by-step plans
- ✅ Assess risks and suggest alternatives
- ❌ NOT make any code changes
- ❌ NOT execute any commands

### Act Mode

Once you've reviewed and approved the plan, execute it:

```bash
/cline-act
# or
/execute
```

In act mode, the AI will:
- ✅ Execute the plan step by step
- ✅ Make code changes as specified
- ✅ Run verification commands
- ✅ Report progress after each step
- ⚠️ Stop and ask for guidance on errors

### Exit Cline Mode

Return to normal OpenCode behavior:

```bash
/cline-exit
```

## 📖 Example Workflow

```bash
# 1. Start with a feature request in plan mode
/cline-plan Add soft delete functionality to the notes system

# AI creates a detailed plan with:
# - Impact scope (files to modify/create)
# - Step-by-step implementation
# - Risk assessment
# - Verification steps

# 2. Review the plan, ask questions, iterate
Can you also add a trash view to show deleted notes?

# 3. Once satisfied, execute the plan
/execute

# AI executes step by step:
# ✅ Step 1/8: Update Note Model
# ✅ Step 2/8: Create Database Migration
# ✅ Step 3/8: Modify Delete API
# ...

# 4. Return to normal mode when done
/cline-exit
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

## 🔧 Configuration

The plugin works with default settings, but you can customize prompts by editing:

- `prompts/plan.md` - Plan mode system prompt
- `prompts/act.md` - Act mode system prompt

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

## 📚 Related Projects

- [OpenCode](https://opencode.ai) - The open source AI coding agent
- [oh-my-opencode](https://github.com/code-yeongyu/oh-my-opencode) - Advanced OpenCode plugin harness
- [awesome-opencode](https://github.com/awesome-opencode/awesome-opencode) - Curated list of OpenCode resources

## 🐛 Issues

Found a bug? Have a feature request? Please [open an issue](https://github.com/trry/opencode-cline-mode/issues).

## 📮 Contact

- GitHub: [@trry](https://github.com/trry)
- Issues: [GitHub Issues](https://github.com/trry/opencode-cline-mode/issues)

---

**Made with ❤️ for the OpenCode community**
