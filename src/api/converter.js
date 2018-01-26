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

  /** PUT / - Create a new entity */
  async update(req, res) {
    const id = req.params.converter;
    const pathDeCompressedFile = `${process.env.PWD}/decompressed/${id}`;
    try {
      const { files, newPath } = await checkFolders(pathDeCompressedFile);
      const ConvertItunesCommander = new ConvertItunes(config.LAST_FM_API_KEY, config.EXTENSION_ACCEPTED, files, newPath);
      await ConvertItunesCommander.init();
      
      return res.status(200).send({
        message: `The tracks of this album has been filled with metadata`
      })
    } catch (err) {
      logger.error(err);
      return res.status(500).send(err);
    }
  }
});