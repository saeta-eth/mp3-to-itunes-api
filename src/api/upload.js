import resource from 'resource-router-middleware';
import path from 'path';
import uuid from 'uuid';
import * as fs from 'async-file';
import axios from 'axios';

import {
  decompressedFile,
  checkAverageExtension,
  removeFilesExceptExt
} from '../lib/util';

import log4js from '../lib/logger';
const fileName = path.basename(__filename, path.extname(__filename));
const logger = log4js.getLogger(fileName)

const pathCompressed = `${process.cwd()}/compressed`;
const pathDecompressed = `${process.cwd()}/decompressed`;

export default ({ config, db }) => resource({
  
  id : 'upload',

  create(req, res) {
    if (!req.files) {
      return res.status(500).send('No files were uploaded.');
    }
    
    const compressedFile = req.files.file;
    const mimetype = compressedFile.mimetype;
    
    if(mimetype === 'application/zip' || path.parse(compressedFile.name).ext === '.zip') {

      const id = uuid.v1();

      const pathCompressedFile = `${pathCompressed}/${id}${path.parse(compressedFile.name).ext}`;
      const pathDecompressedFile = `${pathDecompressed}/${id}`;

      compressedFile.mv(pathCompressedFile, async (err) => {
        if (err) {
          logger.error(err);
          return res.status(500).send(err);
        }
        
        decompressedFile(pathCompressedFile, pathDecompressedFile, path.parse(compressedFile.name).ext, async (err) => {
          if (err) {
            logger.error(err);
            return res.status(500).send(err);
          }
          try {
            // Now does't accept request to port 80. Ignore port in producion environment when build an URL.
            const url = process.env.NODE_ENV === 'development' 
              ? `${config.baseUrl}:${config.port}/api/upload/${id}`
              : `${config.baseUrl}/api/upload/${id}`;

            await axios.put(url);
            return res.status(200).json({
              id: id
            });
          } catch(err) {
            logger.error(err);
            return res.status(500).send(err.response.data);
          }
        });
      });
    } else {
      return res.status(500).send('The file is not a zip or tar.');
    }
  },

  async update(req, res) {
    const folderName = req.params.upload;
    const pathDecompressedFile = `${pathDecompressed}/${folderName}`;

    if (!folderName) {
      return res.status(400).send('No upload id found.');
    }
    
    if (!(await fs.exists(pathDecompressedFile))) {
      return res.status(500).json({
        message: `The ID: ${folderName} is not found.`
      });
    }

    const extensionsPercentageAccepted = await checkAverageExtension(config.extensionAccepted, pathDecompressedFile);

    if (extensionsPercentageAccepted > config.porcentageAccepted) {
      // @slorenzo: If is an album, I remove other files with different extension.
      try {
        removeFilesExceptExt(config.extensionAccepted, pathDecompressedFile);
        return res.status(200).json({
          message: 'The .zip was successfully loaded'
        });
      } catch(err) {
        logger.error(err);
        return res.status(500).send(err);
      }
    } else {
      // Now does't accept request to port 80. Ignore port in producion environment when build an URL.
      const url = process.env.NODE_ENV === 'development' 
        ? `${config.baseUrl}:${config.port}/api/upload/${req.params.upload}`
        : `${config.baseUrl}/api/upload/${req.params.upload}`;

      try {
        await axios.delete(url);
        return res.status(500).json({
          message: 'The .zip not contains .mp3 files'
        });
      } catch(err) {
        logger.error(err);
        return res.status(500).send(err);
      }
    }
  },

  /** DELETE /:id - Delete a given entity */
  async delete(req, res) {
    const id = req.params.upload;
    try {
      await fs.unlink(`${process.cwd()}/compressed/${id}.zip`);
      await fs.rimraf(`${process.cwd()}/itunes/${id}`);
      await fs.rimraf(`${process.cwd()}/decompressed/${id}`);
      return res.status(200).json({
        message: `All about ${id} were removed`
      });
    } catch(err) {
      logger.error(err);
      return res.status(500).send(err.message);
    }
  }
});
