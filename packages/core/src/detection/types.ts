import type { Confidence, Diagnostic } from "../types/common.js";
import type {
  EcosystemId,
  FrameworkId,
  LanguageId,
  PackageManagerId,
  ProjectTypeId
} from "../types/ids.js";

export type DetectionEvidenceKind =
  | "file"
  | "directory"
  | "package-json"
  | "lockfile"
  | "config"
  | "manifest"
  | "source";

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

export interface ProjectTypeMatch {
  id: ProjectTypeId;
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
  projectTypes: ProjectTypeMatch[];
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
