# Troubleshooting

Common issues and solutions for OpenCode Cline Mode Plugin.

## Installation Issues

### OpenCode Startup Failure

**Error**: `Unrecognized key: "plugins"`

**Cause**: Incorrect `plugins` field in `opencode.json`

**Solution**:
```bash
# Check for incorrect field
grep "plugins" ~/.config/opencode/opencode.json

# Remove the field (it should be "plugin", not "plugins")
# Or run verify script
./verify-setup.sh
```

### Plugin Not Loading

**Symptoms**:
- No `cline-plan` or `cline-act` agents visible
- Plugin seems disabled

**Diagnosis**:
```bash
# Run verification
./verify-setup.sh

# Check plugin file exists
ls -la ~/.config/opencode/plugins/opencode-cline-mode/

# Check if disabled
ls -la ~/.config/opencode/plugins/ | grep cline
```

**Solutions**:

1. **Re-enable plugin**:
   ```bash
   ./enable-plugin.sh
   ```

2. **Reinstall symlink**:
   ```bash
   rm ~/.config/opencode/plugins/opencode-cline-mode
   ln -s $(pwd) ~/.config/opencode/plugins/opencode-cline-mode
   ```

3. **Check config**:
   ```bash
   cat ~/.config/opencode/opencode-cline-mode.json
   ```

## Agent Issues

### Too Many Agents Visible

**Problem**: Seeing 4+ agents instead of just 2

**Expected**:
- `cline-plan`
- `cline-act`

**Also seeing**:
- `build`
- `plan`
- `general`

**Solution**:

The plugin's `replace_default_agents: true` setting should hide native agents. If not working:

1. **Verify plugin config**:
   ```bash
   cat ~/.config/opencode/opencode-cline-mode.json
   # Should show: "replace_default_agents": true
   ```

2. **Manual hide in opencode.json**:
   ```json
   {
     "agent": {
       "build": {"mode": "subagent", "hidden": true},
       "plan": {"mode": "subagent", "hidden": true}
     },
     "default_agent": "cline-plan"
   }
   ```

3. **Restart OpenCode** after config changes

### Wrong Default Agent

**Problem**: OpenCode starts with `build` or `plan` instead of `cline-plan`

**Solution**:

1. **Check plugin config**:
   ```json
   {
     "default_agent": "cline-plan"
   }
   ```

2. **Check opencode.json**:
   ```json
   {
     "default_agent": "cline-plan"
   }
   ```

3. **Restart OpenCode**

### Plan Mode Making Changes

**Problem**: AI is modifying files in plan mode

**Cause**: Using wrong agent or configuration issue

**Solution**:

1. **Verify agent**:
   - Press `Tab` to confirm you're using `cline-plan`
   - Should show "Cline Plan Mode" in description

2. **Check agent tools config**:
   - The plugin disables `bash`, `edit`, `write` for `cline-plan`
   - If tools are enabled, reinstall plugin

3. **Force reload**:
   ```bash
   ./disable-plugin.sh
   ./enable-plugin.sh
   # Restart OpenCode
   ```

## Configuration Issues

### Config File Not Found

**Problem**: Plugin uses default config instead of custom config

**Locations checked** (in order):
1. `.opencode/opencode-cline-mode.json` (project)
2. `~/.config/opencode/opencode-cline-mode.json` (user)

**Solution**:
```bash
# Create config file
mkdir -p ~/.config/opencode
cat > ~/.config/opencode/opencode-cline-mode.json << 'EOF'
{
  "replace_default_agents": true,
  "default_agent": "cline-plan"
}
EOF
```

### Config Changes Not Taking Effect

**Problem**: Changed config but OpenCode still using old settings

**Solution**:

1. **Restart OpenCode** completely
2. **Clear any caches**:
   ```bash
   rm -rf ~/.cache/opencode
   ```
3. **Verify config is valid JSON**:
   ```bash
   cat ~/.config/opencode/opencode-cline-mode.json | jq '.'
   ```

### Model Configuration Not Working

**Problem**: `plan_model` or `act_model` not being used

**Diagnosis**:
```bash
# Check config
cat ~/.config/opencode/opencode-cline-mode.json

# Should have:
# "plan_model": "provider/model-name"
```

**Solution**:

1. **Use correct model format**:
   ```json
   {
     "plan_model": "anthropic/claude-opus-4",
     "act_model": "anthropic/claude-sonnet-4"
   }
   ```

2. **Verify model is available**:
   ```bash
   opencode --list-models
   ```

## Execution Issues

### Act Mode Stops Unexpectedly

**Problem**: Execution stops mid-plan

**Possible causes**:
1. AI encountered an error
2. AI is waiting for user input
3. Context limit reached

**Solution**:

1. **Check last message** for error details
2. **Type "continue"** to resume
3. **Type "status"** to see current progress
4. **Restart session** if needed

### File Permission Errors

**Problem**: `EACCES` or permission denied errors

**Solution**:
```bash
# Check file permissions
ls -la /path/to/file

# Fix permissions if needed
chmod 644 /path/to/file

# Or run with appropriate permissions
```

### Command Failures

**Problem**: Shell commands failing in act mode

**Common issues**:
1. Command not found
2. Wrong working directory
3. Missing environment variables

**Solution**:

1. **Verify command exists**:
   ```bash
   which <command>
   ```

2. **Check working directory**:
   - AI should use correct directory
   - Can specify in prompt: "Run this in the backend directory"

3. **Set environment variables**:
   - Add to `.env` file
   - Or specify in command: `NODE_ENV=test npm test`

## Performance Issues

### Slow Response Time

**Possible causes**:
1. Large codebase
2. Slow model
3. Network latency

**Solutions**:

1. **Use faster model**:
   ```json
   {
     "plan_model": "anthropic/claude-sonnet-4",
     "act_model": "anthropic/claude-sonnet-4"
   }
   ```

2. **Reduce context**:
   - Work in smaller chunks
   - Focus on specific files

3. **Check network**:
   ```bash
   ping api.anthropic.com
   ```

### Memory Issues

**Problem**: OpenCode crashes or becomes unresponsive

**Solution**:
```bash
# Restart OpenCode
# Clear caches
rm -rf ~/.cache/opencode

# If using nvm, ensure correct Node version
node --version  # Should be 18+
```

## Recovery

### Reset Plugin Configuration

```bash
# Backup current config
cp ~/.config/opencode/opencode-cline-mode.json ~/.config/opencode/opencode-cline-mode.json.backup

# Reset to default
cat > ~/.config/opencode/opencode-cline-mode.json << 'EOF'
{
  "replace_default_agents": true,
  "default_agent": "cline-plan"
}
EOF

# Restart OpenCode
```

### Reinstall Plugin

```bash
# Remove existing
rm -rf ~/.config/opencode/plugins/opencode-cline-mode

# Reinstall from source
cd /path/to/opencode-cline-mode
ln -s $(pwd) ~/.config/opencode/plugins/opencode-cline-mode

# Or from npm
npm install -g opencode-cline-mode
```

### Restore Native Agents

```bash
# Disable plugin
./disable-plugin.sh

# Or remove opencode.json agent config
# Edit ~/.config/opencode/opencode.json
# Remove "agent" and "default_agent" fields
```

## Getting Help

### Diagnostic Information

When reporting issues, include:

```bash
# System info
uname -a
node --version
npm --version

# OpenCode info
opencode --version

# Plugin status
./verify-setup.sh

# Config files
cat ~/.config/opencode/opencode.json
cat ~/.config/opencode/opencode-cline-mode.json

# Plugin files
ls -la ~/.config/opencode/plugins/opencode-cline-mode/
```

### Report Issue

1. Search existing issues: https://github.com/trry-hub/opencode-cline-mode/issues
2. Create new issue with:
   - Description of problem
   - Steps to reproduce
   - Expected vs actual behavior
   - Diagnostic information
   - Screenshots if applicable

## Next Steps

- [Configuration Guide](configuration.md) - Review settings
- [Usage Guide](usage.md) - Learn best practices
- [Contributing](contributing.md) - Help improve the plugin
