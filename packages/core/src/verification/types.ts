import type { Diagnostic } from "../types/common.js";

export type VerificationStatus = "pass" | "warning" | "fail";

export interface VerificationCheck {
  id: string;
  label: string;
  status: VerificationStatus;
  message?: string;
}

export interface VerificationResult {
  status: VerificationStatus;
  checks: VerificationCheck[];
  diagnostics: Diagnostic[];
}
