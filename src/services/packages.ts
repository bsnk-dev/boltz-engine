import {writeFileSync, readFileSync, existsSync, mkdirSync} from 'fs';
import {join, resolve} from 'path';
import stringHash from 'string-hash';
import {exec} from 'child_process';
import config from './config';

/**
 * @description Manages package installation and name resolution.
 */
class PackagesService {
  sandboxDirectory = (process.env.production) ?
    config.json.execution.vms.sandboxDirectory.production :
    config.json.execution.vms.sandboxDirectory.development;

  /**
   * Installs packages from the package.json and prunes unneeded packages.
   * @param {string} packageJSON the package.json file
   * @param {string} volumeID The id of the volume.
   */
  async installPackages(packageJSON: string, volumeID: string) {
    mkdirSync(join(this.sandboxDirectory, 'vm-packages', volumeID), {recursive: true});

    if (!this.needsToInstallPackages(volumeID, packageJSON)) return;

    writeFileSync(join(this.sandboxDirectory, 'vm-packages', volumeID, 'package.json'), packageJSON);

    await new Promise((resolve, reject) => {
      exec(`cd ${join(this.sandboxDirectory, 'vm-packages', volumeID)} && npm i --only=prod && npm prune`).on('close', resolve).on('error', reject);
    });
  }

  /**
   * Checks if a package.json has been canged and needs to have its packages installed.
   * @param {string} volumeID The id of the volume.
   * @param {string} packageJSON the package.json file
   * @return {boolean}
   */
  needsToInstallPackages(volumeID: string, packageJSON: string) {
    if (!existsSync(join(this.sandboxDirectory, 'vm-packages', volumeID, 'package.json'))) return true;

    const diskPackageJSON = readFileSync(join(this.sandboxDirectory, 'vm-packages', volumeID, 'package.json'));

    if (stringHash(diskPackageJSON.toString()) !== stringHash(packageJSON)) {
      return true;
    }

    return false;
  }

  /**
   * Returns a resolver that resolves the package name to the actual package path for a specific volume
   * @param {string} volumeID The id of the volume.
   * @return {Function}
   */
  packageResolverFactory(volumeID: string) {
    return (packageName: string) => {
      return resolve(this.sandboxDirectory, 'vm-packages', volumeID, 'node_modules', packageName);
    };
  }
}

export default new PackagesService();
