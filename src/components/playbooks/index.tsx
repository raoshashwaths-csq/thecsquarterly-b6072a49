import type { FC } from "react";
import HealthScoreCalculator from "./HealthScoreCalculator";
import QbrDeckTemplatePack from "./QbrDeckTemplatePack";
import OnboardingPlaybook from "./OnboardingPlaybook";
import ChurnEarlyWarningSystem from "./ChurnEarlyWarningSystem";
import AiReadinessDiagnostic from "./AiReadinessDiagnostic";
import ExpansionRevenuePlaybook from "./ExpansionRevenuePlaybook";

export const PLAYBOOK_COMPONENTS: Record<string, FC> = {
  "cs-health-score-calculator": HealthScoreCalculator,
  "qbr-deck-template-pack": QbrDeckTemplatePack,
  "90-day-onboarding-playbook": OnboardingPlaybook,
  "churn-early-warning-system": ChurnEarlyWarningSystem,
  "cs-ai-readiness-diagnostic": AiReadinessDiagnostic,
  "expansion-revenue-playbook": ExpansionRevenuePlaybook,
};
