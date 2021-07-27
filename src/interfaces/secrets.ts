export interface SecretsConfig {
  authentication: Authentication;
  ssl: SSL,
}
export interface Authentication {
  password: string;
  username: string;
}
export interface SSL {
  passphrase: string;
}
