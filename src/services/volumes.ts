import { CachedVolumeI } from "../interfaces/caching";
import { Volume } from "../interfaces/instances";
import { Volume as Vol, vol } from 'memfs';
import database from "./database";
import LogManager from "./logManager";
import config from "./config";

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
        this.logs.log(`Removing volume ${volume.volume._id} from memory`);
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
      return vol.volume._id === volumeID;
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

    this.inMemoryVolumes.push({
      volume,
      api: loadedVolume,
      timeLastUsed: Date.now(),
      ttl: config.json.execution.ttl.volumes,
    });

    return loadedVolume;
  }
}

export default new VolumesService();
