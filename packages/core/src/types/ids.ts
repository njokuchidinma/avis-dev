export type EcosystemId = string;
export type FrameworkId = string;
export type IntegrationId = string;
export type CapabilityId = string;
export type PackageManagerId = string;
export type LanguageId = string;
export type ProjectTypeId = string;

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
  react: "react",
  vue: "vue",
  nuxt: "nuxt",
  svelte: "svelte",
  sveltekit: "sveltekit",
  reactNative: "react-native",
  expo: "expo",
  express: "express",
  nestjs: "nestjs",
  fastify: "fastify",
  django: "django",
  flask: "flask",
  flutter: "flutter",
  rails: "rails",
  laravel: "laravel",
  symfony: "symfony",
  fastapi: "fastapi",
  axum: "axum",
  actixWeb: "actix-web",
  gin: "gin",
  fiber: "fiber",
  echo: "echo"
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
  go: "go",
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

export const projectTypes = {
  frontend: "frontend",
  backend: "backend",
  fullstack: "fullstack",
  mobile: "mobile",
  library: "library",
  cli: "cli",
  service: "service"
} as const satisfies Record<string, ProjectTypeId>;
