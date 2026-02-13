# Usage Guide

Complete guide to using OpenCode Cline Mode Plugin.

## Overview

The plugin provides a **Plan → Act** workflow:

1. **Plan Mode**: Analyze requirements, create detailed plans
2. **Act Mode**: Execute approved plans step by step

## Plan Mode (`cline-plan`)

### Starting Plan Mode

Plan mode is the default when OpenCode starts.

**Manual switch**:
- Press `Tab` → select `cline-plan`
- Type `/agent cline-plan`
- Type `replan` or `重新规划`

### What Plan Mode Does

In plan mode, the AI will:

- ✅ Analyze your codebase
- ✅ Create detailed step-by-step plans
- ✅ Identify impacted files
- ✅ Assess risks
- ✅ Suggest alternatives

The AI will **NOT**:
- ❌ Modify any files
- ❌ Execute any commands
- ❌ Make changes to the codebase

### Plan Output Format

Plans follow this structure:

```markdown
### 📊 Overview
Brief description of what will be done and why.

### 📁 Impact Scope
**Modified Files**:
- `path/to/file.ts` - Reason for modification

**New Files**:
- `path/to/new-file.ts` - Purpose of new file

### 📝 Detailed Plan
**Step N: [Title]**
- Operation: read | create | update | delete | command
- Target: File path or command
- Description: What will be done
- Verification: How to verify success

### ⚠️ Risk Warnings
High-risk operations highlighted here.

### 🔄 Alternative Approaches
Different implementation options.
```

### Example Plan Session

```
User: I want to add soft delete to the notes system

AI (cline-plan):
Let me analyze the codebase...

[Analyzes files: src/models/note.ts, src/api/notes.ts, prisma/schema.prisma]

### 📊 Overview
Add soft delete functionality to notes system, allowing notes to be 
"deleted" without permanent removal.

### 📁 Impact Scope
**Modified Files**:
- `prisma/schema.prisma` - Add deletedAt field
- `src/models/note.ts` - Add soft delete methods
- `src/api/notes.ts` - Update delete endpoint
- `src/api/trash.ts` - New file for trash operations

### 📝 Detailed Plan
**Step 1/5: Update Prisma Schema**
- Operation: update
- Target: `prisma/schema.prisma`
- Description: Add `deletedAt DateTime?` field to Note model
- Verification: Run `npx prisma generate`
- Risk Level: low

[... more steps ...]

### ⚠️ Risk Warnings
- Database migration required (medium risk)
- Existing delete queries need updating (low risk)

### 🔄 Alternative Approaches
1. Use a separate DeletedNote table
2. Use a status field instead of deletedAt

Ready to execute? Press Tab and select `cline-act`.
```

## Act Mode (`cline-act`)

### Starting Act Mode

**Switch to act mode**:
- Press `Tab` → select `cline-act`
- Type `/agent cline-act`
- Type `execute` or `执行`

### What Act Mode Does

In act mode, the AI will:

- ✅ Execute plans step by step
- ✅ Make code changes
- ✅ Run verification commands
- ✅ Report progress after each step
- ⚠️ Stop and ask for guidance on errors

### Execution Process

For each step:

1. **Read the Step** - Understand what to do
2. **Execute** - Use appropriate tools (read/write/edit/bash)
3. **Verify** - Check if step succeeded
4. **Report** - Update user on progress

### Progress Reporting

```markdown
✅ **Step 1 Complete**: Update Prisma Schema
- **File changed**: `prisma/schema.prisma`
- **Change**: Added `deletedAt DateTime?` field
- **Verification**: ✅ Prisma generate successful
- **Next**: Create database migration

**Progress**: 1/5 steps completed (20%)
```

### Error Handling

When an error occurs:

```markdown
❌ **Error in Step 3**

**Error**: TS2345: Argument of type 'string' is not assignable...
**Step**: Create login endpoint in `src/api/auth.ts`
**Cause**: Incorrect type in bcrypt.compare usage

**Possible Solutions**:

1. **Fix type error**: Convert password to Buffer
   - Change: `await bcrypt.compare(password, user.passwordHash)`
   - Risk: Low

2. **Skip type check**: Use `@ts-ignore` (not recommended)
   - Risk: High

**Waiting for your decision**:
- Type "fix: convert to string" to apply solution 1
- Type "skip" to skip this step
- Type "abort" to cancel execution
```

### Example Act Session

```
User: Execute the plan

AI (cline-act):
Starting Plan Execution...

📋 **Plan**: Add soft delete to notes system
📊 **Total Steps**: 5

---

**Step 1/5**: Update Prisma Schema

✅ **Step 1 Complete**: Modified schema
- **File changed**: `prisma/schema.prisma`
- **Verification**: ✅ Prisma generate successful
- **Next**: Create database migration

**Progress**: 1/5 (20%)

---

**Step 2/5**: Create Database Migration

✅ **Step 2 Complete**: Generated migration
- **Files created**: `prisma/migrations/20250210_add_deleted_at/`
- **Verification**: ✅ Migration status shows new migration
- **Next**: Update note model

**Progress**: 2/5 (40%)

---

[... continues ...]

---

🎉 **Plan Execution Complete!**

**Summary**:
- ✅ All 5 steps completed successfully
- 📝 **Files Modified**: 3
- 📄 **Files Created**: 2
- ⚠️ **Errors Encountered**: 0

**Next Steps**:
- Test the soft delete functionality
- Verify trash view displays deleted notes
- Run full test suite
```

## Workflow Patterns

### Pattern 1: Feature Development

```
1. Plan Mode: Describe feature → Get detailed plan
2. Review: Check plan, ask questions, request modifications
3. Act Mode: Execute plan → Verify → Complete
4. Plan Mode: Plan tests, documentation
5. Act Mode: Execute additional tasks
```

### Pattern 2: Bug Fixing

```
1. Plan Mode: Describe bug → Root cause analysis
2. Plan Mode: Review fix strategy
3. Act Mode: Implement fix → Run tests
4. Verify: Confirm bug is resolved
```

### Pattern 3: Refactoring

```
1. Plan Mode: Describe refactor scope
2. Plan Mode: Identify all affected files
3. Plan Mode: Create step-by-step migration plan
4. Act Mode: Execute carefully with tests at each step
```

## Modifying Plans During Execution

If you need to change a step while executing:

```
User: Wait, let's also add a trash view

AI (cline-act):
📝 **Step Modification Requested**

**Original Step 4**: Update delete endpoint
**Requested Change**: Also create trash view

**Updating plan...**

**New Step 4**: Update delete endpoint and create trash view
- Added: Create `src/components/TrashView.tsx`

Executing modified step...
```

## Best Practices

### Planning

1. **Be Specific**: Provide detailed requirements
2. **Ask Questions**: Clarify ambiguities before executing
3. **Review Carefully**: Check all steps before approval
4. **Consider Risks**: Pay attention to risk warnings

### Execution

1. **Watch Progress**: Monitor each step
2. **Verify Changes**: Check file modifications
3. **Test Incrementally**: Run tests after risky changes
4. **Ask for Help**: Don't hesitate to ask questions on errors

## Next Steps

- [Configuration Guide](configuration.md) - Customize plugin behavior
- [Troubleshooting](troubleshooting.md) - Common issues and solutions
- [Contributing](contributing.md) - Help improve the plugin
