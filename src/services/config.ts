import {readFileSync} from 'fs';
import {ConfigFile} from '../interfaces/config';
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
     * @param {string} filePath - The path to the configuration file
     * @return {void}
     */
    constructor(filePath: string) {
      this.filePath = filePath;
      this.config = this.load(filePath) as ConfigFile;

      // load the secrets file based on the environment
      this.secretsConfig = this.load((process.env.production == 'true') ?
        this.config.secrets.path.production :
        this.config.secrets.path.development);
    }

    /**
     * Gets a configuration value
     */
    get json() {
      return this.config;
    }

    /**
     * Gets the secrets configuration
     */
    get secrets() {
      return this.secretsConfig;
    }
}

export default new Config('./config.json');
