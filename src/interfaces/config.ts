export interface Config {
  secrets: SecretsOrDatabase;
  database: SecretsOrDatabase;

  adminPort: number;
  executePort: number;
}
export interface SecretsOrDatabase {
  path: Path;
}
export interface Path {
  production: string;
  development: string;
}
