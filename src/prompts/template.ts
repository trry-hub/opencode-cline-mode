import { getActVsPlanModeSection } from './components/actVsPlanMode.js';
import { getAgentRoleSection } from './components/agentRole.js';
import { getCapabilitiesSection } from './components/capabilities.js';
import { getRulesSection } from './components/rules.js';

/**
 * Build system prompt for cline-plan or cline-act agent
 */
export function buildSystemPrompt(mode: 'plan' | 'act'): string {
  const sections = [
    getAgentRoleSection(mode),
    getCapabilitiesSection(mode),
    getRulesSection(mode),
    getActVsPlanModeSection(),
  ];

  return sections.join('\n\n====\n\n');
}

/**
 * Base template with placeholders (for future extensibility)
 */
export const baseTemplate = `{{AGENT_ROLE_SECTION}}

====

{{CAPABILITIES_SECTION}}

====

{{RULES_SECTION}}

====

{{ACT_VS_PLAN_SECTION}}
`;
