# Contributing Guide

Thank you for your interest in contributing to OpenCode Cline Mode Plugin!

## Ways to Contribute

- **Report bugs** - Submit issues with detailed information
- **Suggest features** - Share ideas for new functionality
- **Improve documentation** - Fix typos, add examples, clarify instructions
- **Submit pull requests** - Fix bugs or add new features

## Development Setup

### Prerequisites

- Node.js 18+
- npm or yarn
- Git
- OpenCode AI installed

### Clone and Setup

```bash
# Fork the repository on GitHub
# Then clone your fork
git clone https://github.com/YOUR_USERNAME/opencode-cline-mode.git
cd opencode-cline-mode

# Install dependencies
npm install

# Create symlink for local testing
ln -s $(pwd) ~/.config/opencode/plugins/opencode-cline-mode
```

### Project Structure

```
opencode-cline-mode/
├── index.js                    # Plugin main file
├── prompts/
│   ├── plan.md                 # Plan mode system prompt
│   └── act.md                  # Act mode system prompt
├── commands/
│   └── start-work.md           # Command template
├── docs/                       # Documentation
│   ├── getting-started.md
│   ├── configuration.md
│   ├── usage.md
│   ├── troubleshooting.md
│   └── contributing.md
├── examples/                   # Example configurations
├── scripts/
│   ├── enable-plugin.sh        # Enable plugin
│   ├── disable-plugin.sh       # Disable plugin
│   └── verify-setup.sh         # Verify installation
├── package.json
├── README.md
├── LICENSE
├── opencode-cline-mode.schema.json
└── opencode-cline-mode.example.json
```

## Development Workflow

### 1. Create a Branch

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/your-bug-fix
```

### 2. Make Changes

- Write clear, concise code
- Follow existing code style
- Add comments where necessary
- Update documentation if needed

### 3. Test Your Changes

```bash
# Verify plugin still works
./verify-setup.sh

# Test in OpenCode
opencode
# - Check both cline-plan and cline-act agents
# - Test switching between agents
# - Test plan and act workflows
```

### 4. Commit Changes

Write clear commit messages:

```bash
git add .
git commit -m "feat: add new configuration option"
# or
git commit -m "fix: resolve agent visibility issue"
# or
git commit -m "docs: clarify installation steps"
```

**Commit Message Format**:
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `refactor:` - Code refactoring
- `test:` - Adding tests
- `chore:` - Maintenance tasks

### 5. Push and Create PR

```bash
git push origin feature/your-feature-name
```

Then create a Pull Request on GitHub.

## Code Style

### JavaScript

- Use ES6+ features
- Use `const` and `let`, avoid `var`
- Use async/await instead of `.then()`
- Use template literals
- Add JSDoc comments for functions

**Example**:
```javascript
/**
 * Load plugin configuration
 * @param {string} directory - Working directory
 * @returns {Object} Plugin configuration
 */
function loadPluginConfig(directory) {
  // Try multiple config locations
  const configPaths = [
    join(directory, '.opencode', 'opencode-cline-mode.json'),
    join(homedir(), '.config', 'opencode', 'opencode-cline-mode.json'),
  ];
  
  for (const configPath of configPaths) {
    if (existsSync(configPath)) {
      try {
        const content = readFileSync(configPath, 'utf-8');
        return JSON.parse(content);
      } catch (error) {
        console.warn(`Failed to load config from ${configPath}:`, error);
      }
    }
  }
  
  return getDefaultConfig();
}
```

### Markdown

- Use ATX-style headers (`#`, `##`, etc.)
- Use fenced code blocks with language tags
- Keep lines under 100 characters
- Use relative links for internal references

## Adding New Features

### Adding Configuration Options

1. **Update schema** (`opencode-cline-mode.schema.json`):
   ```json
   {
     "properties": {
       "new_option": {
         "type": "string",
         "description": "Description of new option"
       }
     }
   }
   ```

2. **Update default config** (`index.js`):
   ```javascript
   function loadPluginConfig(directory) {
     // ...
     return {
       replace_default_agents: true,
       default_agent: 'cline-plan',
       new_option: 'default_value', // Add here
     };
   }
   ```

3. **Use in plugin**:
   ```javascript
   const newOption = pluginConfig.new_option;
   ```

4. **Update documentation** (`docs/configuration.md`)

### Modifying System Prompts

1. **Edit prompt files**:
   - `prompts/plan.md` - Plan mode behavior
   - `prompts/act.md` - Act mode behavior

2. **Test thoroughly**:
   - Test in various scenarios
   - Ensure clear communication
   - Check for unintended behaviors

3. **Document changes**:
   - Update usage examples
   - Note any behavior changes

## Testing

### Manual Testing Checklist

When making changes, test:

- [ ] Plugin loads without errors
- [ ] `cline-plan` agent appears in list
- [ ] `cline-act` agent appears in list
- [ ] Default agent is `cline-plan`
- [ ] Native agents are hidden (if configured)
- [ ] Plan mode doesn't modify files
- [ ] Act mode can modify files
- [ ] Switching between agents works
- [ ] Configuration options work
- [ ] Error handling works

### Test Scenarios

1. **Fresh Installation**:
   ```bash
   rm -rf ~/.config/opencode/plugins/opencode-cline-mode
   ln -s $(pwd) ~/.config/opencode/plugins/opencode-cline-mode
   opencode
   ```

2. **Configuration Changes**:
   - Test with `replace_default_agents: true`
   - Test with `replace_default_agents: false`
   - Test with different models
   - Test with different temperatures

3. **Error Cases**:
   - Missing config file
   - Invalid JSON in config
   - Missing prompt files
   - Invalid model names

## Documentation

### Updating Docs

When adding features or changing behavior:

1. **Update relevant docs**:
   - `docs/getting-started.md` - For new user-facing features
   - `docs/configuration.md` - For new config options
   - `docs/usage.md` - For workflow changes
   - `docs/troubleshooting.md` - For common issues

2. **Update README.md** if needed

3. **Add examples** if applicable

### Writing Style

- Use clear, simple language
- Provide code examples
- Use headings and lists for readability
- Include both basic and advanced examples
- Link to related documentation

## Release Process

(For maintainers)

1. **Update version** in `package.json`
2. **Update CHANGELOG** with changes
3. **Create git tag**:
   ```bash
   git tag -a v1.0.1 -m "Release v1.0.1"
   git push origin v1.0.1
   ```
4. **Publish to npm**:
   ```bash
   npm publish
   ```

## Getting Help

- **Questions**: Open a GitHub Discussion
- **Bugs**: Open a GitHub Issue
- **Chat**: (If applicable, add chat link)

## Code of Conduct

- Be respectful and inclusive
- Welcome newcomers
- Focus on constructive feedback
- Assume good intentions

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to OpenCode Cline Mode Plugin! 🎉
