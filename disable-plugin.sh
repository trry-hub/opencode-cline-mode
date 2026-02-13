#!/bin/bash

# OpenCode Cline Mode Plugin - Disable Script
# This script disables the plugin by renaming it, allowing OpenCode to use default agents

set -e

PLUGIN_DIR="$HOME/.config/opencode/plugins"
PLUGIN_FILE="$PLUGIN_DIR/opencode-cline-mode.js"
PLUGIN_FILE_DISABLED="$PLUGIN_DIR/opencode-cline-mode.js.disabled"

echo "🔌 Disabling OpenCode Cline Mode Plugin..."
echo ""

# Check if plugin is enabled
if [ -f "$PLUGIN_FILE" ]; then
  echo "✓ Found enabled plugin, disabling..."
  mv "$PLUGIN_FILE" "$PLUGIN_FILE_DISABLED"
  echo "✓ Plugin disabled"
elif [ -f "$PLUGIN_FILE_DISABLED" ]; then
  echo "✓ Plugin is already disabled"
else
  echo "⚠️  Plugin file not found at: $PLUGIN_FILE"
  echo "   The plugin may not be installed."
  exit 1
fi

echo ""
echo "✅ Plugin disabled successfully!"
echo ""
echo "📝 What happens now:"
echo "   - OpenCode will use the default agents from opencode.json"
echo "   - Your original agent configuration is restored"
echo "   - The plugin files are preserved (just renamed to .disabled)"
echo ""
echo "💡 To re-enable the plugin, run: ./enable-plugin.sh"
echo ""
echo "⚠️  Remember to restart OpenCode for changes to take effect"
