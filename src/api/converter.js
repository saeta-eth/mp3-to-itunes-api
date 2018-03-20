import resource from 'resource-router-middleware';
import path from 'path';
import * as fs from 'async-file';
import axios from 'axios';

import {
  getFilesFromFolder,
  checkFolders
} from '../lib/util';

import log4js from '../lib/logger';
const fileName = path.basename(__filename, path.extname(__filename));
const logger = log4js.getLogger(fileName);

import ConvertItunes from '../lib/converter';

export default ({ config, db }) => resource({
  
  /** Property name to store preloaded entity on `request`. */
  id: 'converter',

  async read(req, res) {
    try {
      const files = await getFilesFromFolder(`${process.cwd()}/itunes/${req.params.converter}`);
      const fileName = files[0].split('/').pop();
      const extension = path.extname(fileName);
      const fileNameWithoutExt = fileName.split('.')[0];
      res.download(files[0], `${fileNameWithoutExt} (by mp3-to-video)${extension}`);  
    } catch(err) {
      return res.status(500).send(err);
    }
  },

  /** PUT / - Create a new entity */
  async update(req, res) {
    const id = req.params.converter;
    const pathDeCompressedFile = `${process.cwd()}/decompressed/${id}`;
    const pathItunesCompressedFile = `${process.cwd()}/itunes/${id}`;
    try {
      const { files, newPath } = await checkFolders(pathDeCompressedFile);
      const ConvertItunesCommander = new ConvertItunes(config.lastFmApiKey, config.extensionAccepted, files, newPath, pathItunesCompressedFile);
      await ConvertItunesCommander.init();
      
      return res.status(200).send({
        message: `The tracks of this album has been filled`
      })
    } catch (err) {
      logger.error(err);
      return res.status(500).send(err.message);
    }
  }
});