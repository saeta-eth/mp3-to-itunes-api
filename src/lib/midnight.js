import schedule from 'node-schedule';
import * as fs from 'async-file';

import {
  getFilesFromFolder
} from './util';

// run everyday at midnight
export function removeFilesMidnight() {
  schedule.scheduleJob('0 0 * * *', async () => {
    const decompressedFolder = `${process.env.PWD}/decompressed`;
    const compressedFolder = `${process.env.PWD}/compressed`;
    const itunesFolder = `${process.env.PWD}/itunes`;

    const files = await getFilesFromFolder(compressedFolder);
    for (let file of files) {
      const fileName = file.split('/').pop();
      const id = file.split('.')[0]
      await fs.unlink(`${compressedFolder}/${fileName}`);
      await fs.rimraf(`${process.env.PWD}/itunes/${id}`);
      await fs.rimraf(`${process.env.PWD}/decompressed/${id}`);
    
    }
  });
}
