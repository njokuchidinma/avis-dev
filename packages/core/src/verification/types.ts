import type { Diagnostic } from "../types/common.js";
import type { IntegrationId } from "../types/ids.js";

export type IntegrationHealth =
  | "not-installed"
  | "healthy"
  | "partial"
  | "broken"
  | "unknown";

export type VerificationCheckStatus = "pass" | "warning" | "fail" | "skipped";

export interface VerificationCheck {
  id: string;
  label: string;
  status: VerificationCheckStatus;
  message?: string;
  remediation?: string;
}

export interface VerificationResult {
  integrationId: IntegrationId;
  health: IntegrationHealth;
  checks: VerificationCheck[];
  diagnostics: Diagnostic[];
}
