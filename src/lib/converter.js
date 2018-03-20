import LastFM from 'last-fm';
import ffmetadata from 'ffmetadata';
import fs from 'fs';
import path from 'path';
import zipdir from 'zip-dir';
import config from 'dos-config';
import iconv from 'iconv-lite';
import log4js from '../lib/logger';

const fileName = path.basename(__filename, path.extname(__filename));
const logger = log4js.getLogger(fileName);

class ConvertItunes {
  constructor(
    apiKey = this.throwIfMissing(),
    extensions = this.throwIfMissing(),
    mp3Files = this.throwIfMissing(),
    path = this.throwIfMissing(),
    pathItunes = this.throwIfMissing()
  ) {
    this.isString(apiKey);
    this.isArray(mp3Files);
    this.lastFM = new LastFM(apiKey, 'MyApp/1.0.0 (http://example.com)');
    this.mp3Files = mp3Files;
    this.extensions = extensions;
    this.path = path;
    this.pathItunes = pathItunes;
    this.albumInfo = [];
    this.thumbnail = '';
    this.artist = '';
    this.album = '';
  }

  /**
    * It is a getter, should show all params
  */
  get getAttributes() {
    return `ApiKey: ${this.apiKey} | mp3Files: ${this.mp3Files}!`;
  }

  /**
    * It is a setter for mp3Files variable
    * @param {String} mp3Files
  */
  set changeMp3Files(mp3Files) {
    this.mp3Files = mp3Files;
  }

  /**
    * It is a setter for apiKey
    * @param {String} api key of last.fm api
  */
  set changeApiKey(apiKey) {
    this.apiKey = apiKey;
  }

  /**
    * Check if params is an array
    * @param {Any} value be a array
  */
  isArray(obj) {
    if (!(!!obj && obj.constructor === Array)) {
      throw 'Wrong type parameter.';
    }
  }

  /**
    * Check if params is a string
    * @param {Any} value be a string
  */
  isString(value) {
    if (typeof value !== 'string' && !(value instanceof String)) {
      throw 'Wrong type parameter.';
    }
  }

  /**
    * Set default error if parameter is missing
  */
  throwIfMissing() {
    throw 'Missing parameter.';
  }

  /**
    * Get mp3 metadata.
    * @param {String} filePath (eg. /path/to/song.mp3)
    * @return Promise
  */

  getMetadata(filePath) {
    return new Promise((resolve, reject) => {
      ffmetadata.read(filePath, (err, data) => {
        if (err) {
          reject(err);
        } else {
          resolve(data);
        }
      });
    });
  }

  /**
    * Write metadata to an mp3 file.
    * @param {String} filePath (eg. /path/to/song.mp3)
    * @param {Object} metadata
    * @param {Object} options
    * @return Promise
  */

  setMetadata(filePath, metadata, options) {
    return new Promise((resolve, reject) => {
      ffmetadata.write(filePath, metadata, options, (err, data) => {
        if (err) {
          reject(err);
        } else {
          resolve(data);
        }
      });
    });
  }

  /**
    * Search track information on LastFM.
    * @param {String} title
    * @param {String} artist
    * @return {Promise}
  */

  trackInfo(title, artist) {
    return new Promise((resolve, reject) => {
      this.lastFM.trackInfo({
        name: title,
        artistName: artist,
      }, (err, data) => {
        if(err) {
          reject(err);
        } else {
          resolve(data); 
        }
      });
    });
  }

  /**
    * Fill this.albumInfo with lastFM data.
  */

  async fillAlbumInfo() {
    return Promise.all(this.mp3Files.map(async (mp3, index) => {
      const path = `${this.path}/${mp3}`;
      try {
        const metadata = await this.getMetadata(path);
        const track = this.formatStringToCompare(mp3);
        const titleDecoded = iconv.decode(metadata.title, 'iso-8859-1')
        const title = this.checkAccent(titleDecoded) ? track : metadata.title || null;
        const info = await this.trackInfo(title, metadata.artist);

        this.albumInfo.push({
          title: info.name,
          artist: info.artistName || null,
          album: info.albumName || null,
          thumbnail: (info.images && info.images.length && info.images[info.images.length - 1]) || null,
          position: parseInt(info.position) || parseInt(metadata.track) || null
        });
      } catch(err) {
        logger.error(err);
        throw err;
      }
    }));
  }

  /**
    * Check if there is an accent in a string.
    * @param {String} str
    * @return Boolean
    * 
  */

  checkAccent(str) {
    return /[\u0300-\u036f]/g.test(str.normalize('NFD'));
  }

  /**
    * Fill this.thumbnail with most commond value
    * Fill this.artist with most commond value
    * Fill this.album with most commond value
  **/

  async fillSpecificInfoFromAlbumInfo() {
    this.albumInfo = this.albumInfo.sort((a, b) => {
      return a.position - b.position
    });

    const thumbnail = this.albumInfo
      .filter(track => Boolean(track.thumbnail))
      .map(track => track.thumbnail)

    const artist = this.albumInfo
      .filter(track => Boolean(track.artist))
      .map(track => track.artist);

    const album = this.albumInfo
      .filter(track => Boolean(track.album))
      .map(track => track.album);

    this.thumbnail = this.findMostCommondValue(thumbnail);
    this.artist = this.findMostCommondValue(artist);
    this.album = this.findMostCommondValue(album);
  }

  /**
    * Get most commond value using fields of array of objects.
    * @params {Array} arr
    * @return {Array} 
  **/

  findMostCommondValue(arr) {
    const tally = (acc, x) => { 
      if (! acc[x]) { 
        acc[x] = 1;
        return acc;
      } 
      acc[x] += 1;
      return acc;
    };

    const totals = arr.reduce(tally, {});

    const keys = Object.keys(totals);

    const values = keys.map(x => totals[x]);

    const results = keys.filter(x => totals[x] === Math.max(...values));

    return results;
  }

  /**
    * Fill itunes metadata.
  **/

  async fillMetada() {
    for(let trackInfo of this.albumInfo) {
      for (let file of this.mp3Files) {
        const title  = this.formatStringToCompare(trackInfo.title);
        const trackName = this.formatStringToCompare(file);

        if(trackName.includes(title) || this.compareStrings(trackName, title) > config.stringComparePercentageAccepted) {
          const filePath = `${this.path}/${file}`;
          
          const metadata = {
            title: trackInfo.title,
            artist: this.artist[0],
            album: this.album[0],
            track: trackInfo.position,
            comment: 'Apple Lossless created by mp3-to-itunes.com',
          };

          const options = {
            attachments: [...this.thumbnail]
          };

          try {
            await this.setMetadata(filePath, metadata, options);  
          } catch(err) {
            logger.error(err);
            throw err;
          }
        }
      }
    }
  }

  /**
    * Get the string comparation based on Levenshtein distance.
    * @params {String} s1
    * @params {String} s2
    * @return {Number} 
  **/

  compareStrings(s1, s2) {
    let longer = s1.toLowerCase();
    let shorter = s2.toLowerCase();
    if (s1.length < s2.length) {
      longer = s2;
      shorter = s1;
    }
    const longerLength = longer.length;
    if (longerLength == 0) {
      return 1.0;
    }
    return (longerLength - this.editDistance(longer, shorter)) / parseFloat(longerLength);
  }

  editDistance(s1, s2) {
    let costs = new Array();
    for (let i = 0; i <= s1.length; i++) {
      let lastValue = i;
      for (let j = 0; j <= s2.length; j++) {
        if (i == 0)
          costs[j] = j;
        else {
          if (j > 0) {
            let newValue = costs[j - 1];
            if (s1.charAt(i - 1) != s2.charAt(j - 1)) {
              newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
            }
            costs[j - 1] = lastValue;
            lastValue = newValue;
          }
        }
      }
      if (i > 0)
        costs[s2.length] = lastValue;
    }
    return costs[s2.length];
  }

  /**
    * Create a zip file from folder
    * @return {Promise}
  **/

  async createZipFile() {
    return new Promise((resolve, reject) => {
      !fs.existsSync(this.pathItunes) && fs.mkdirSync(this.pathItunes);
      zipdir(this.path, { saveTo: `${this.pathItunes}/${this.album[0]}.zip` }, function (err, buffer) {
        if(err) {
          reject(err);
        } else {
          resolve(buffer);
        }
      });
    });
  }

  /**
    * Format file path as track name.
    * @param {String} file path (eg. /path/to/song.mp3)
    * @return {String}
  **/

  formatStringToCompare(str) {
    return str
      .toLowerCase()
      .replace(/.mp3/g, '')
      .replace(/\d+/g, '')
      .replace(/'/g, '')
      .replace(/-/g, '')
      .replace(/\[.*?\]\s?/g, '')
      .replace(/ *\([^)]*\) */g, "")
      .replace(/[^\w\s]/gi, '')
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .trim()
      
  }

  /**
    * It is a module initialize.
  */
  async init() {
    await this.fillAlbumInfo();
    await this.fillSpecificInfoFromAlbumInfo();
    await this.fillMetada();
    await this.createZipFile();
  }
}

export default ConvertItunes;