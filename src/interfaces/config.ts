export interface Config {
  secrets: SecretsOrDatabase;
  database: SecretsOrDatabase;
  execution: Execution;
  adminPort: number;
  executePort: number;
  dbPort: number;
  maxWorkerProcesses: number;
  ssl: SSL,
}
export interface SecretsOrDatabase {
  path: PathOrSandboxDirectory;
}
export interface PathOrSandboxDirectory {
  production: string;
  development: string;
}
export interface Execution {
  ttl: Ttl;
  vms: Vms;
  gcInterval: number;
}
export interface Ttl {
  volumes: number;
  vms: number;
}
export interface Vms {
  sandboxDirectory: PathOrSandboxDirectory;
}
export interface SSL {
  enabled: boolean;
  keyPath: PathOrSandboxDirectory;
  certPath: PathOrSandboxDirectory;
}
