#!/bin/bash

# OpenCode Cline Mode Plugin - Verification Script
# This script verifies that the plugin is properly installed and configured

set -e

PLUGIN_DIR="$HOME/.config/opencode/plugins"
PLUGIN_FILE="$PLUGIN_DIR/opencode-cline-mode.js"
PLUGIN_FILE_DISABLED="$PLUGIN_DIR/opencode-cline-mode.js.disabled"
PROMPTS_DIR="$PLUGIN_DIR/prompts"
PLAN_PROMPT="$PROMPTS_DIR/plan.md"
ACT_PROMPT="$PROMPTS_DIR/act.md"
CONFIG_FILE="$HOME/.config/opencode/opencode-cline-mode.json"
OPENCODE_CONFIG="$HOME/.config/opencode/opencode.json"

echo "🔍 Verifying OpenCode Cline Mode Plugin Setup..."
echo ""

# Track overall status
ALL_CHECKS_PASSED=true

# Check 1: Plugin file
echo "1️⃣  Checking plugin file..."
if [ -f "$PLUGIN_FILE" ]; then
  echo "   ✓ Plugin is enabled: $PLUGIN_FILE"
elif [ -f "$PLUGIN_FILE_DISABLED" ]; then
  echo "   ⚠️  Plugin is disabled: $PLUGIN_FILE_DISABLED"
  echo "   Run ./enable-plugin.sh to enable it"
  ALL_CHECKS_PASSED=false
else
  echo "   ❌ Plugin file not found!"
  echo "   Expected: $PLUGIN_FILE"
  ALL_CHECKS_PASSED=false
fi

# Check 2: Prompts directory
echo ""
echo "2️⃣  Checking prompts directory..."
if [ -d "$PROMPTS_DIR" ]; then
  echo "   ✓ Prompts directory exists: $PROMPTS_DIR"
  
  # Check plan.md
  if [ -f "$PLAN_PROMPT" ]; then
    PLAN_SIZE=$(wc -c < "$PLAN_PROMPT")
    echo "   ✓ plan.md exists (${PLAN_SIZE} bytes)"
  else
    echo "   ❌ plan.md not found: $PLAN_PROMPT"
    ALL_CHECKS_PASSED=false
  fi
  
  # Check act.md
  if [ -f "$ACT_PROMPT" ]; then
    ACT_SIZE=$(wc -c < "$ACT_PROMPT")
    echo "   ✓ act.md exists (${ACT_SIZE} bytes)"
  else
    echo "   ❌ act.md not found: $ACT_PROMPT"
    ALL_CHECKS_PASSED=false
  fi
else
  echo "   ❌ Prompts directory not found: $PROMPTS_DIR"
  ALL_CHECKS_PASSED=false
fi

# Check 3: Plugin config file
echo ""
echo "3️⃣  Checking plugin configuration..."
if [ -f "$CONFIG_FILE" ]; then
  echo "   ✓ Config file exists: $CONFIG_FILE"
  
  # Parse and display config
  if command -v jq &> /dev/null; then
    echo "   Configuration:"
    jq '.' "$CONFIG_FILE" | sed 's/^/     /'
  else
    echo "   (Install 'jq' to see formatted config)"
  fi
else
  echo "   ⚠️  Config file not found (will use defaults)"
  echo "   Default: replace_default_agents=true, default_agent=cline-plan"
fi

# Check 4: OpenCode config
echo ""
echo "4️⃣  Checking OpenCode configuration..."
if [ -f "$OPENCODE_CONFIG" ]; then
  echo "   ✓ OpenCode config exists: $OPENCODE_CONFIG"
  
  # Check for invalid 'plugins' field
  if grep -q '"plugins"' "$OPENCODE_CONFIG"; then
    echo "   ❌ Found invalid 'plugins' field in opencode.json!"
    echo "   This will cause OpenCode to fail at startup."
    echo "   Run: sed -i.bak '/"plugins"/d' $OPENCODE_CONFIG"
    ALL_CHECKS_PASSED=false
  else
    echo "   ✓ No invalid 'plugins' field found"
  fi
  
  # Check if native agents are hidden
  if command -v jq &> /dev/null; then
    if jq -e '.agent.build.hidden == true and .agent.plan.hidden == true' "$OPENCODE_CONFIG" > /dev/null 2>&1; then
      echo "   ✓ Native 'build' and 'plan' agents are hidden"
    else
      echo "   ⚠️  Native agents (build/plan) may be visible"
      echo "   To hide them, add to opencode.json:"
      echo '   {"agent": {"build": {"mode": "subagent", "hidden": true}, "plan": {"mode": "subagent", "hidden": true}}}'
    fi
  fi
else
  echo "   ❌ OpenCode config not found: $OPENCODE_CONFIG"
  ALL_CHECKS_PASSED=false
fi

# Check 5: OpenCode version
echo ""
echo "5️⃣  Checking OpenCode installation..."
if command -v opencode &> /dev/null; then
  OPENCODE_VERSION=$(opencode --version 2>&1 || echo "unknown")
  echo "   ✓ OpenCode is installed: v$OPENCODE_VERSION"
else
  echo "   ❌ OpenCode command not found!"
  echo "   Please install OpenCode first"
  ALL_CHECKS_PASSED=false
fi

# Summary
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ "$ALL_CHECKS_PASSED" = true ]; then
  echo "✅ All checks passed! Plugin is ready to use."
  echo ""
  echo "📝 Next steps:"
  echo "   1. Restart OpenCode"
  echo "   2. Run: opencode"
  echo "   3. Press Ctrl+P or type /agent to see available agents"
  echo "   4. You should see 'cline-plan' and 'cline-act'"
  echo ""
  echo "💡 Usage:"
  echo "   - Start in cline-plan mode (default)"
  echo "   - Create a plan for your task"
  echo "   - Switch to cline-act with Tab or /agent cline-act"
  echo "   - Execute the plan"
else
  echo "❌ Some checks failed. Please fix the issues above."
  echo ""
  echo "💡 Common fixes:"
  echo "   - Run ./enable-plugin.sh to enable the plugin"
  echo "   - Copy prompts: cp -r prompts $PROMPTS_DIR"
  echo "   - Fix opencode.json: Remove 'plugins' field if present"
fi
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
