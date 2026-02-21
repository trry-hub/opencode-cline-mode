import { tool } from '@opencode-ai/plugin';

export default tool({
  description: 'Switch from cline-plan to cline-act agent and start execution',
  args: {},
  async execute(args, context) {
    const { client } = context;

    try {
      // Try to trigger agent cycle command
      await client.app.event({
        body: {
          type: 'tui.command.execute',
          properties: {
            command: 'agent.cycle',
          },
        },
      });

      return '✅ Switching to cline-act agent...\n\n**Next Steps:**\n1. Press Tab to confirm agent switch\n2. Select "cline-act" from the agent list\n3. Your plan will be automatically inherited';
    } catch (error) {
      // Fallback if event trigger fails
      return '✅ Ready to switch to cline-act agent!\n\n**Manual Steps:**\n1. Press Tab key\n2. Select "cline-act" from the agent list\n3. Your plan will be automatically inherited\n\n' + 
        (error instanceof Error ? `(Note: ${error.message})` : '');
    }
  },
});
