import type { Confidence, Diagnostic } from "../types/common.js";
import type {
  EcosystemId,
  FrameworkId,
  LanguageId,
  PackageManagerId
} from "../types/ids.js";

export type DetectionEvidenceKind =
  | "file"
  | "directory"
  | "package-json"
  | "lockfile"
  | "config"
  | "manifest";

export interface DetectionEvidence {
  kind: DetectionEvidenceKind;
  path: string;
  description: string;
}

export interface EcosystemMatch {
  id: EcosystemId;
  confidence: Confidence;
  evidence: DetectionEvidence[];
}

export interface FrameworkMatch {
  id: FrameworkId;
  version?: string;
  confidence: Confidence;
  evidence: DetectionEvidence[];
}

export interface PackageManagerMatch {
  id: PackageManagerId;
  version?: string;
  confidence: Confidence;
  evidence: DetectionEvidence[];
}

export interface ProjectTarget {
  id: string;
  root: string;
  relativePath: string;
  ecosystem: EcosystemMatch;
  languages: LanguageId[];
  frameworks: FrameworkMatch[];
  packageManagers: PackageManagerMatch[];
}

export interface DetectionResult {
  root: string;
  targets: ProjectTarget[];
  evidence: DetectionEvidence[];
  diagnostics: Diagnostic[];
}

export interface ProjectDetector {
  id: string;
  detect(root: string): Promise<DetectionResult>;
}
