import { join } from 'path';
import { writeFile, readFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import type { Logger } from './logger';

export interface PlanTask {
  id: string;
  title: string;
  operation: 'create' | 'update' | 'delete' | 'read' | 'command';
  target: string;
  description: string;
  verification: string;
  riskLevel: 'low' | 'medium' | 'high';
  status: 'pending' | 'in_progress' | 'completed';
  estimatedTime?: string;
}

export interface ImplementationPlan {
  id: string;
  title: string;
  createdAt: string;
  status: 'draft' | 'approved' | 'in_progress' | 'completed';
  version: string;
  overview: string;
  goals: string[];
  impactScope: {
    modifiedFiles: Array<{ path: string; reason: string }>;
    newFiles: Array<{ path: string; purpose: string }>;
    deletedFiles: Array<{ path: string; reason: string }>;
  };
  tasks: PlanTask[];
  risks: {
    high: Array<{ description: string; mitigation: string }>;
    medium: Array<{ description: string; mitigation: string }>;
    low: Array<{ description: string; mitigation: string }>;
  };
  alternatives: Array<{
    name: string;
    description: string;
    pros: string[];
    cons: string[];
  }>;
  acceptanceCriteria: string[];
  dependencies: string[];
}

export interface PlanManagerConfig {
  plansDir: string;
  logger?: Logger;
}

export class PlanManager {
  private plansDir: string;
  private logger?: Logger;

  constructor(config: PlanManagerConfig) {
    this.plansDir = config.plansDir;
    this.logger = config.logger;
  }

  async generatePlan(plan: ImplementationPlan): Promise<string> {
    this.logger?.info('Generating implementation plan', { planId: plan.id });

    // Ensure plans directory exists
    if (!existsSync(this.plansDir)) {
      await mkdir(this.plansDir, { recursive: true });
    }

    const planPath = join(this.plansDir, 'implementation_plan.md');
    const content = this.formatPlan(plan);

    await writeFile(planPath, content, 'utf-8');

    this.logger?.info('Plan generated successfully', { planPath });

    return planPath;
  }

  private formatPlan(plan: ImplementationPlan): string {
    const lines: string[] = [
      `# 实现计划：${plan.title}`,
      '',
      `**ID**: ${plan.id}`,
      `**创建时间**: ${plan.createdAt}`,
      `**状态**: ${plan.status}`,
      `**版本**: ${plan.version}`,
      '',
      '---',
      '',
      '## 📊 概述',
      '',
      plan.overview,
      '',
      '## 🎯 目标',
      '',
      ...plan.goals.map((goal, i) => `${i + 1}. ${goal}`),
      '',
      '## 📁 影响范围',
      '',
    ];

    if (plan.impactScope.modifiedFiles.length > 0) {
      lines.push('**修改的文件**:');
      plan.impactScope.modifiedFiles.forEach(file => {
        lines.push(`- \`${file.path}\` - ${file.reason}`);
      });
      lines.push('');
    }

    if (plan.impactScope.newFiles.length > 0) {
      lines.push('**新增的文件**:');
      plan.impactScope.newFiles.forEach(file => {
        lines.push(`- \`${file.path}\` - ${file.purpose}`);
      });
      lines.push('');
    }

    if (plan.impactScope.deletedFiles.length > 0) {
      lines.push('**删除的文件**:');
      plan.impactScope.deletedFiles.forEach(file => {
        lines.push(`- \`${file.path}\` - ${file.reason}`);
      });
      lines.push('');
    }

    lines.push('## 📝 实现步骤', '');

    plan.tasks.forEach((task, i) => {
      lines.push(`### 任务 ${i + 1}: ${task.title}`);
      lines.push(`- **操作**: ${task.operation}`);
      lines.push(`- **目标**: ${task.target}`);
      lines.push(`- **描述**: ${task.description}`);
      lines.push(`- **验证**: ${task.verification}`);
      lines.push(`- **风险等级**: ${task.riskLevel}`);
      lines.push(`- **状态**: ${task.status}`);
      if (task.estimatedTime) {
        lines.push(`- **预计时间**: ${task.estimatedTime}`);
      }
      lines.push('');
    });

    lines.push('## ⚠️ 风险评估', '');

    if (plan.risks.high.length > 0) {
      lines.push('### 高风险');
      plan.risks.high.forEach(risk => {
        lines.push(`- ${risk.description} - ${risk.mitigation}`);
      });
      lines.push('');
    }

    if (plan.risks.medium.length > 0) {
      lines.push('### 中风险');
      plan.risks.medium.forEach(risk => {
        lines.push(`- ${risk.description} - ${risk.mitigation}`);
      });
      lines.push('');
    }

    if (plan.risks.low.length > 0) {
      lines.push('### 低风险');
      plan.risks.low.forEach(risk => {
        lines.push(`- ${risk.description} - ${risk.mitigation}`);
      });
      lines.push('');
    }

    if (plan.alternatives.length > 0) {
      lines.push('## 🔄 替代方案', '');

      plan.alternatives.forEach((alt, i) => {
        lines.push(`### 方案 ${String.fromCharCode(65 + i)}: ${alt.name}`);
        lines.push(alt.description);
        lines.push('');
        lines.push('**优点**:');
        alt.pros.forEach(pro => lines.push(`- ${pro}`));
        lines.push('');
        lines.push('**缺点**:');
        alt.cons.forEach(con => lines.push(`- ${con}`));
        lines.push('');
      });
    }

    lines.push('## ✅ 验收标准', '');
    plan.acceptanceCriteria.forEach(criteria => {
      lines.push(`- [ ] ${criteria}`);
    });
    lines.push('');

    if (plan.dependencies.length > 0) {
      lines.push('## 📌 依赖', '');
      plan.dependencies.forEach(dep => {
        lines.push(`- ${dep}`);
      });
      lines.push('');
    }

    lines.push('---', '');
    lines.push('## 📜 变更历史', '');
    lines.push('| 日期 | 版本 | 变更内容 | 作者 |');
    lines.push('|------|------|---------|------|');
    lines.push(`| ${plan.createdAt.split('T')[0]} | ${plan.version} | 初始版本 | AI |`);

    return lines.join('\n');
  }

  async loadPlan(planPath: string): Promise<ImplementationPlan | null> {
    try {
      await readFile(planPath, 'utf-8');
      // Parse the markdown content back to ImplementationPlan
      // This is a simplified version - in production, you'd use a proper parser
      this.logger?.info('Plan loaded', { planPath });
      return null; // TODO: Implement parsing
    } catch (error) {
      this.logger?.error('Failed to load plan', { error, planPath });
      return null;
    }
  }

  generatePlanId(): string {
    const now = new Date();
    const date = now.toISOString().split('T')[0];
    const timestamp = now.getTime();
    return `plan-${date}-${timestamp}`;
  }
}
