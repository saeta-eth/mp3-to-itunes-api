import schedule from 'node-schedule';
import * as fs from 'async-file';
import path from 'path';

import {
  getFilesFromFolder
} from './util';

// run everyday at midnight
export function removeFilesAtMidnight() {
  schedule.scheduleJob('0 0 * * *', async () => {
    const decompressedFolder = `${process.cwd()}/decompressed`;
    const compressedFolder = `${process.cwd()}/compressed`;
    const itunesFolder = `${process.cwd()}/itunes`;

    const files = await getFilesFromFolder(compressedFolder);
    for (let file of files) {
      const fileName = path.parse(file).name;
      const id = file.split('.')[0];
      await fs.unlink(`${compressedFolder}/${fileName}`);
      await fs.rimraf(`${itunesFolder}/${id}`);
      await fs.rimraf(`${decompressedFolder}/${id}`);
    }
  });
}
