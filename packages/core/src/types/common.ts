export type Severity = "info" | "warning" | "error";

export type Confidence = "low" | "medium" | "high";

export interface VersionRange {
  raw: string;
}

export interface Diagnostic {
  severity: Severity;
  message: string;
}
