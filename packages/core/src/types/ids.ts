export type EcosystemId = string;
export type FrameworkId = string;
export type IntegrationId = string;
export type CapabilityId = string;
export type PackageManagerId = string;
export type LanguageId = string;

export const ecosystems = {
  node: "node",
  python: "python",
  php: "php",
  dart: "dart",
  rust: "rust",
  go: "go",
  jvm: "jvm",
  dotnet: "dotnet",
  ruby: "ruby",
  swift: "swift",
  cCpp: "c-cpp"
} as const satisfies Record<string, EcosystemId>;

export const frameworks = {
  nextjs: "nextjs",
  django: "django",
  flutter: "flutter",
  rails: "rails",
  laravel: "laravel",
  fastapi: "fastapi"
} as const satisfies Record<string, FrameworkId>;

export const packageManagers = {
  npm: "npm",
  pnpm: "pnpm",
  yarn: "yarn",
  bun: "bun",
  pip: "pip",
  uv: "uv",
  poetry: "poetry",
  composer: "composer",
  cargo: "cargo",
  pub: "pub",
  maven: "maven",
  gradle: "gradle",
  nuget: "nuget",
  bundler: "bundler"
} as const satisfies Record<string, PackageManagerId>;

export const languages = {
  javascript: "javascript",
  typescript: "typescript",
  python: "python",
  php: "php",
  dart: "dart",
  rust: "rust",
  go: "go",
  java: "java",
  kotlin: "kotlin",
  csharp: "csharp",
  ruby: "ruby",
  swift: "swift",
  c: "c",
  cpp: "cpp"
} as const satisfies Record<string, LanguageId>;
