import resource from 'resource-router-middleware';
import path from 'path';

import {
  getFilesFromFolder,
  checkFolder
} from '../lib/util';

import log4js from '../lib/logger';
const fileName = path.basename(__filename, path.extname(__filename));
const logger = log4js.getLogger(fileName);

import ConvertItunes from '../lib/converter';

export default ({ config, db }) => resource({
  id: 'converter',
  /** GET / - Download album for itunes. */
  async read(req, res) {
    try {
      const files = await getFilesFromFolder(`${process.cwd()}/itunes/${req.params.converter}`);
      const fileName = path.parse(files[0]).name;
      const extension = path.parse(files[0]).ext;
      res.download(files[0], `${fileName} (by mp3-to-itunes.com)${extension}`);  
    } catch(err) {
      return res.status(500).send(err);
    }
  },

  /** PUT / - Convert album to itunes format. */
  async update(req, res) {
    const id = req.params.converter;
    const pathDeCompressedFile = `${process.cwd()}/decompressed/${id}`;
    const pathItunesCompressedFile = `${process.cwd()}/itunes/${id}`;
    try {
      const { files, pathFolder } = await checkFolder(pathDeCompressedFile);
      const ConvertItunesCommander = new ConvertItunes(config.lastFmApiKey, config.extensionAccepted, files, pathFolder, pathItunesCompressedFile);
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