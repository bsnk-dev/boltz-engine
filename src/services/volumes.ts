import { CachedVolumeI } from "../interfaces/caching";
import { Volume } from "../interfaces/instances";
import { Volume as Vol, vol } from 'memfs';
import database from "./database";
import LogManager from "./logManager";
import config from "./config";
import packages from "./packages";

/** Manages volumes and caching them in memory. */
class VolumesService {
  private inMemoryVolumes: CachedVolumeI[] = [];
  private logs = new LogManager().updateContext('VolumesService');

  /**
  * Garbage collect unsed cached volumes and vms
  */
  private gc() {
    this.inMemoryVolumes = this.inMemoryVolumes.filter(volume => {
      if (volume.timeLastUsed < Date.now() - volume.ttl) {
        this.logs.log(`Removing volume ${volume.volume.id} from memory`);
        return false;
      }
      return true;
    });
  }

  /**
   * Starts garbage collection
   */
  constructor() {
    setInterval(this.gc.bind(this), config.json.execution.gcInterval);
  }

  /**
   * Gets a volume, and if it's cached returns that
   */
  public async getVolume(volumeID: string): Promise<typeof vol> {
    const cachedVolume = this.inMemoryVolumes.find(vol => {
      return vol.volume.id === volumeID;
    });

    if (cachedVolume) {
      cachedVolume.timeLastUsed = Date.now();
      return cachedVolume.api;
    }

    const volumeData = await database.getVolumeById(volumeID).catch(err => {
      throw this.logs.error(`Failed to retrieve volume, ${err}`);
    });

    if (!volumeData) {
      throw this.logs.error(`Failed to retrieve volume, ${volumeID} not found`);
    }

    const volume = new Volume(volumeData);
    const loadedVolume = Vol.fromJSON(volume.files);

    const packageJSON = loadedVolume.readFileSync('/package.json');
    await packages.installPackages(packageJSON.toString(), volumeID); 

    this.inMemoryVolumes.push({
      volume,
      api: loadedVolume,
      timeLastUsed: Date.now(),
      ttl: config.json.execution.ttl.volumes,
    });

    return loadedVolume;
  }

  /**
   * Reloads a volume that was modified in the cache
   * @param volumeID
   * @returns {Promise<void>}
   */
  public async reloadVolume(volumeID: string): Promise<void> {
    const vol = this.inMemoryVolumes.find(vol => {
      return vol.volume.id === volumeID;
    });

    if (!vol) return;

    this.logs.customContext(['reloadVolume']).log(`Reloading volume ${volumeID}`);
    
    const volumeData = await database.getVolumeById(volumeID).catch(err => {
      throw this.logs.error(`Failed to retrieve volume, ${err}`);
    });

    if (!volumeData) {
      throw this.logs.error(`Failed to retrieve volume, ${volumeID} not found`);
    }

    const volume = new Volume(volumeData);
    const loadedVolume = Vol.fromJSON(volume.files);

    vol.volume = volume;
    vol.api = loadedVolume;
  }
}

export default new VolumesService();
