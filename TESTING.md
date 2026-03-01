# E2E Testing Guide for opencode-cline-mode

This document describes how to manually verify the plugin works correctly in OpenCode.

## Prerequisites

1. OpenCode installed (version >= 1.0.0)
2. Node.js >= 18.0.0
3. This plugin built and ready to install

## Installation

### Option 1: Install from npm (Recommended)

```bash
npm install -g opencode-cline-mode
```

Then add to your OpenCode config (`~/.config/opencode/opencode.json`):

```json
{
  "plugin": ["opencode-cline-mode"]
}
```

### Option 2: Install from local files

```bash
# Build the plugin
npm run build

# Symlink to OpenCode plugins directory
ln -s $(pwd) ~/.config/opencode/plugins/opencode-cline-mode
```

**Important**: When using local installation, do NOT add to `plugin` array in config.

## Manual Test Procedure

### Test 1: Plugin Loads Correctly

**Steps**:

1. Start OpenCode: `opencode`
2. Press `Tab` to see available agents

**Expected Result**:

- You should see only 2 agents:
  - `cline-plan` - Planning mode
  - `cline-act` - Execution mode
- Default OpenCode agents (plan, build, etc.) should NOT be visible

**Evidence**: Screenshot of agent list

---

### Test 2: cline-plan Agent Works (Read-Only Mode)

**Steps**:

1. Start OpenCode with cline-plan: `opencode --agent cline-plan`
2. Ask the AI to analyze a file: "Read package.json and tell me the project name"
3. Try to ask it to edit a file: "Add a new dependency to package.json"

**Expected Result**:

- Reading files should work: AI successfully reads and analyzes package.json
- Editing should be blocked: AI should refuse to edit or explain it cannot modify files

**Evidence**: Chat logs showing successful read and refused edit

---

### Test 3: cline-act Agent Works (Full Access Mode)

**Steps**:

1. Switch to cline-act: Press `Tab` and select `cline-act`
2. Ask the AI to create a test file: "Create a file test.txt with content 'hello world'"

**Expected Result**:

- AI should be able to create the file
- Bash commands should ask for permission (if configured to `ask`)

**Evidence**: Chat logs showing successful file creation

---

### Test 4: Plan Inheritance

**Steps**:

1. Start with cline-plan agent
2. Ask: "Analyze the project structure and create a plan to add a new feature"
3. Wait for the plan to complete (you should see "📋 Plan Complete!" notification)
4. Switch to cline-act agent: Press `Tab` and select `cline-act`

**Expected Result**:

- The first cline-act message should contain:
  - "📋 **Inherited Plan from cline-plan**" header
  - The full plan content from cline-plan
  - "Starting step-by-step execution..." footer

**Evidence**: Chat logs showing plan inheritance

---

### Test 5: /start-act Tool

**Steps**:

1. In cline-plan mode, create a plan
2. After plan completion, type: `/start-act`
3. The tool should execute

**Expected Result**:

- Tool executes without requiring approval
- Message: "🚀 **Switching to Execution Mode**"
- Instructions to press `Tab` and select `cline-act`

**Evidence**: Chat logs showing /start-act execution

---

### Test 6: Permission Enforcement

**Steps**:

1. In cline-plan mode, try to use `write_to_file` or `execute_command`
2. In cline-act mode, try to use `execute_command` (should ask permission)

**Expected Result**:

- cline-plan: Edit/bash commands are denied
- cline-act: Edit allowed, bash asks for permission

**Evidence**: Chat logs showing permission enforcement

---

## Test Results Checklist

Fill in after running tests:

- [ ] Test 1: Plugin loads - Only cline-plan and cline-act visible
- [ ] Test 2: cline-plan read-only mode works
- [ ] Test 3: cline-act full access mode works
- [ ] Test 4: Plan inheritance works when switching agents
- [ ] Test 5: /start-act tool works
- [ ] Test 6: Permission enforcement works correctly

---

## Troubleshooting

### Plugin not loading

**Symptom**: Default agents still visible

**Solutions**:

1. Check `~/.config/opencode/opencode.json` has `"plugin": ["opencode-cline-mode"]`
2. Check plugin is installed: `npm list -g opencode-cline-mode`
3. Check OpenCode version: `opencode --version` (must be >= 1.0.0)

### Plan not inherited

**Symptom**: Switching to cline-act doesn't show plan

**Solutions**:

1. Make sure you completed a plan in cline-plan first
2. Check the transform hook is registered (check logs)
3. Verify message structure in debug mode

### /start-act tool not found

**Symptom**: Typing `/start-act` doesn't work

**Solutions**:

1. Make sure `enable_execute_command: true` in config
2. Check tool hook is registered
3. Try using `Tab` to switch agents manually

---

## Reporting Issues

If tests fail:

1. Save chat logs showing the failure
2. Note OpenCode version: `opencode --version`
3. Note plugin version: `npm list -g opencode-cline-mode`
4. Create issue at: https://github.com/trry-hub/opencode-cline-mode/issues

Include:

- Which test failed
- Expected vs actual behavior
- Chat logs
- OpenCode and plugin versions
