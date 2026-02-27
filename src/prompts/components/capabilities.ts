/**
 * Tool capabilities component
 */

export function getCapabilitiesSection(mode: 'plan' | 'act'): string {
  const planTools = `## Available Tools (PLAN MODE)

You have access to these read-only tools:
- **read_file**: Read file contents
- **list_files**: List directory contents
- **search_files**: Search for patterns in files
- **list_code_definitions**: List code symbols

You CANNOT use:
- write_to_file
- replace_in_file
- execute_command`;

  const actTools = `## Available Tools (ACT MODE)

You have access to all tools:
- **read_file**: Read file contents
- **write_to_file**: Create new files
- **replace_in_file**: Edit existing files
- **execute_command**: Run shell commands
- **list_files**: List directory contents
- **search_files**: Search for patterns in files
- **list_code_definitions**: List code symbols
- **attempt_completion**: Present completed work to user`;

  return mode === 'plan' ? planTools : actTools;
}
