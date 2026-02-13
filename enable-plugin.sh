#!/bin/bash

# OpenCode Cline Mode Plugin - Enable Script
# This script ensures the plugin is enabled and properly configured

set -e

PLUGIN_DIR="$HOME/.config/opencode/plugins"
PLUGIN_FILE="$PLUGIN_DIR/opencode-cline-mode.js"
PLUGIN_FILE_DISABLED="$PLUGIN_DIR/opencode-cline-mode.js.disabled"
PROMPTS_DIR="$PLUGIN_DIR/prompts"
CONFIG_FILE="$HOME/.config/opencode/opencode-cline-mode.json"
COMMANDS_DIR="$HOME/.config/opencode/commands"
PROJECT_DIR="/Users/trry/6bt/myproject/opencode-cline-mode"

echo "🔌 Enabling OpenCode Cline Mode Plugin..."
echo ""

# Check if plugin directory exists
if [ ! -d "$PLUGIN_DIR" ]; then
  echo "❌ Plugin directory not found: $PLUGIN_DIR"
  echo "   Creating directory..."
  mkdir -p "$PLUGIN_DIR"
fi

# Check if plugin is disabled
if [ -f "$PLUGIN_FILE_DISABLED" ]; then
  echo "✓ Found disabled plugin, re-enabling..."
  mv "$PLUGIN_FILE_DISABLED" "$PLUGIN_FILE"
  echo "✓ Plugin enabled"
elif [ -f "$PLUGIN_FILE" ]; then
  echo "✓ Plugin is already enabled"
else
  echo "❌ Plugin file not found!"
  echo "   Expected location: $PLUGIN_FILE"
  echo ""
  echo "   Please copy the plugin files to the correct location:"
  echo "   cp index.js $PLUGIN_FILE"
  echo "   cp -r prompts $PROMPTS_DIR"
  exit 1
fi

# Check prompts directory
if [ ! -d "$PROMPTS_DIR" ]; then
  echo "⚠️  Prompts directory not found: $PROMPTS_DIR"
  echo "   Please copy the prompts directory:"
  echo "   cp -r prompts $PROMPTS_DIR"
  exit 1
else
  echo "✓ Prompts directory exists"
fi

# Copy commands
echo ""
echo "📝 Installing custom commands..."
mkdir -p "$COMMANDS_DIR"
if [ -d "$PROJECT_DIR/commands" ]; then
  cp "$PROJECT_DIR"/commands/*.md "$COMMANDS_DIR/" 2>/dev/null || true
  echo "✓ Commands installed to $COMMANDS_DIR"
else
  echo "⚠️  No commands directory found in project"
fi

# Check config file
if [ ! -f "$CONFIG_FILE" ]; then
  echo "⚠️  Config file not found, creating default..."
  cat > "$CONFIG_FILE" << 'EOF'
{
  "$schema": "https://raw.githubusercontent.com/trry-hub/opencode-cline-mode/main/opencode-cline-mode.schema.json",
  "replace_default_agents": true,
  "default_agent": "cline-plan"
}
EOF
  echo "✓ Created default config: $CONFIG_FILE"
else
  echo "✓ Config file exists: $CONFIG_FILE"
fi

echo ""
echo "✅ Plugin enabled successfully!"
echo ""
echo "📝 Next steps:"
echo "   1. Restart OpenCode"
echo "   2. You should see 'cline-plan' and 'cline-act' agents"
echo "   3. Default agent will be 'cline-plan'"
echo "   4. Use /start-work to switch from plan to act mode"
echo ""
echo "💡 To disable the plugin, run: ./disable-plugin.sh"
