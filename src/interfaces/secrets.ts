export interface SecretsConfig {
  authentication: Authentication;
}
export interface Authentication {
  password: string;
  username: string;
}
