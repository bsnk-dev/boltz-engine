export interface ConfigFile {
  secrets: Secrets;
}
export interface Secrets {
  path: Path;
}
export interface Path {
  production: string;
  development: string;
}
