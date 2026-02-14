# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.3] - 2026-02-14

### Fixed
- **Agent Replacement**: Simplified replacement logic - now completely excludes original agents instead of trying to hide them
- Removed `hidden: true` approach which may not be supported by OpenCode
- Plugin now only provides `cline-plan` and `cline-act` when `replace_default_agents: true`

## [2.0.2] - 2026-02-14

### Fixed
- **Agent Hiding**: Fixed issue where native `plan` and `build` agents were still visible
- Native agents are now explicitly marked as `hidden: true` and `mode: 'subagent'`
- This ensures only `cline-plan` and `cline-act` are visible when `replace_default_agents: true`

### Changed
- `src/index.ts`: Added explicit agent hiding logic instead of just replacing config

## [2.0.1] - 2026-02-14

### Fixed
- Minor fixes and improvements

## [2.0.0] - 2026-02-14

### Added
- **Dynamic Cline Integration**: Fetch latest prompts directly from Cline's official GitHub repository
- **Smart Caching System**: Local cache with configurable TTL to reduce network requests
- **Tool Name Mapping**: Automatic conversion of Cline tool names to OpenCode tool names
- **Flexible Prompt Sources**: Choose between `local`, `github`, or `auto` mode
- **Version Control**: Specify Cline version or use `latest` to always get the newest prompts
- **Fallback Strategy**: Automatically fall back to local prompts if GitHub fetch fails
- New configuration options:
  - `prompt_source`: Control where prompts come from
  - `cline_version`: Specify Cline version to use
  - `cache_ttl`: Configure cache expiration time
  - `fallback_to_local`: Enable/disable fallback to local prompts

### Changed
- **BREAKING**: Removed backward compatibility - now requires new configuration format
- **BREAKING**: Default agents are now completely removed (not just hidden) when `replace_default_agents: true`
- Prompts are now dynamically loaded instead of pre-loaded at startup
- Enhanced logging for prompt loading and caching
- Improved error handling with detailed error messages
- Better agent isolation: only `cline-plan` and `cline-act` are visible when replacing default agents

### Fixed
- Fixed issue where default agents could still be accessible even when "hidden"
- Default agents are now completely removed from configuration instead of just marked as hidden

### Technical
- Added `ClineAdapter` core module for coordinating prompt fetching and caching
- Added `ClineFetcher` for GitHub API integration
- Added `ClineCache` for local caching with TTL support
- Added `ClineToolMapper` for automatic tool name conversion
- Replaced `hideDefaultAgents` with `filterClineOnlyAgents` for cleaner agent management
- Comprehensive test coverage for all new modules
- Updated TypeScript types and JSON schema for new configuration options

## [1.3.1] - 2026-02-14

### Performance
- **Startup Optimization**: Changed from synchronous `readFileSync` to asynchronous `readFile` for prompt loading
- Prompts are now pre-loaded in parallel during plugin initialization (non-blocking)
- Added prompt caching to avoid redundant file reads
- Expected startup time improvement: 50-80%

### Changed
- `src/index.ts`: Replaced `import { readFileSync }` with `import { readFile }` from `fs/promises`
- Prompts are now loaded with `Promise.all()` for parallel loading
- Removed test-plugin.js (was causing unnecessary logging)

## [1.3.0] - 2026-02-14

### Changed
- **Major Update**: Rewritten prompts based on Cline's official open-source system prompts
- `prompts/plan.md` now closely follows Cline's PLAN MODE behavior
- `prompts/act.md` now closely follows Cline's ACT MODE behavior
- Improved task progress tracking with `task_progress` parameter
- Better mode switching guidance and user experience

### Added
- Explicit "Plan Complete" prompt requirement in PLAN MODE
- `task_progress` tracking instructions in ACT MODE
- Error handling guidance with solution suggestions
- Clear separation between read-only tools and execution tools

### Technical
- Extracted core system prompts from Cline's GitHub repository
- Adapted Cline's tool system to OpenCode's tool names
- Maintained Cline's workflow philosophy while ensuring OpenCode compatibility

## [1.2.2] - 2026-02-14

### Fixed
- Fixed cline-plan permissions to use OpenCode's `permission` field instead of deprecated `tools` field
- cline-plan now correctly denies edit and bash operations
- cline-act now correctly allows edit operations and asks for bash commands
- Improved plan completion prompt to clarify `/execute-plan` is a tool, not a command
- Enhanced prompt text for better user understanding
- Fixed failing tests after prompt text changes

### Changed
- "Type `/execute-plan`" → "Use `/execute-plan` tool"
- Added additional action descriptions for clarity

## [1.2.1] - 2026-02-14

### Fixed
- Fixed template string syntax error in plan completion message that prevented `/execute-plan` command from being displayed correctly
- Fixed type safety issues in message transformer by adding proper type guards
- Improved error handling in `experimental.chat.messages.transform` hook

### Added
- Comprehensive test coverage for `enableExecuteCommand` configuration option
- ESLint configuration for code quality enforcement
- Prettier configuration for consistent code formatting
- GitHub Actions CI workflow for automated testing
- Additional npm scripts: `test:watch`, `test:coverage`, `typecheck`, `validate`
- Type guard function `isTransformOutput` for safer type checking

### Changed
- Converted `PLAN_COMPLETION_BLOCK` from constant to function for dynamic message generation
- Enhanced plan completion prompt to conditionally show `/execute-plan` based on configuration
- Improved code formatting across all source files
- Updated documentation to remove broken links

### Developer Experience
- Added comprehensive validation script (`npm run validate`)
- Improved CI/CD pipeline with multi-version Node.js testing
- Better error messages and logging

## [1.2.0] - 2026-02-13

### Added
- `/execute-plan` quick command for switching from plan to act mode
- `show_completion_toast` configuration option
- `enable_execute_command` configuration option
- Automatic plan inheritance from cline-plan to cline-act
- Message transformer for seamless mode switching

### Changed
- Enhanced plan completion prompt with multiple switching options

## [1.1.0] - Previous Release

### Added
- Initial cline-plan and cline-act agents
- Configuration system with JSON Schema validation
- Basic documentation and README

## [1.0.0] - Initial Release

### Added
- Basic plugin structure
- Plan and Act mode separation
- OpenCode plugin integration
