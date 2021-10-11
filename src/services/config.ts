import {readFileSync} from 'fs';
import {resolve} from 'path';
import {Config as ConfigFile} from '../interfaces/config';
import {SecretsConfig} from '../interfaces/secrets';

/**
 * Class responsible for loading the configuration file
 */
class Config {
    filePath: string = '';
    config!: ConfigFile;
    secretsConfig!: SecretsConfig;

    /**
     * Loads the configuration file
     * @param {string} filePath - The path to the configuration file
     * @return {any}
     */
    load(filePath: string): any {
      return JSON.parse(readFileSync(filePath, 'utf8'));
    }

    /**
     * Loads the config
     * @param {string} configDir - The path where config files should be found
     * @param {string} filePath - The path to the configuration file
     * @return {void}
     */
    constructor(configDir: string, filePath: string) {
      this.filePath = resolve(configDir, filePath);
      this.config = this.load(this.filePath) as ConfigFile;

      // load the secrets file based on the environment
      this.secretsConfig = this.load((process.env.production == 'true') ?
        this.config.secrets.path.production :
        this.config.secrets.path.development);
    }

    /**
     * Gets a configuration value
     */
    get json(): ConfigFile {
      return this.config;
    }

    /**
     * Gets the secrets configuration
     */
    get secrets() {
      return this.secretsConfig;
    }
}

export default new Config(
  process.env.NODE_ENV == 'docker' ? '/boltz' : './',
  './config.json',
);
