# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
