import resource from 'resource-router-middleware';
import path from 'path';
import uuid from 'uuid';
import * as fs from 'async-file';
import axios from 'axios';

import {
  decompressedFile,
  checkAverageExtension,
  removeFilesExceptExt,
  getFilesFromFolder
} from '../lib/util';

import log4js from '../lib/logger';
const fileName = path.basename(__filename, path.extname(__filename));
const logger = log4js.getLogger(fileName);


export default ({ config, db }) => resource({

  /** Property name to store preloaded entity on `request`. */
  id : 'upload',

  /** POST / - Create a new entity */
  create(req, res) {
    if (!req.files) {
      return res.status(400).send('No files were uploaded.');
    }
    
    const compressedFile = req.files.file;
    const mimetype = compressedFile.mimetype;
    
    if((mimetype === 'application/zip' || path.extname(compressedFile.name) === '.zip') 
      || (mimetype === 'application/tar' || path.extname(compressedFile.name) === '.tar')) {

      const newName = uuid.v1();
      const pathCompressedFile = `${process.env.PWD}/compressed/${newName}${path.extname(compressedFile.name)}`;
      const pathDeCompressedFile = `${process.env.PWD}/decompressed/${newName}`;

      compressedFile.mv(pathCompressedFile, function(err) {
        if (err) {
          return res.status(500).send(err);
        }
        
        decompressedFile(pathCompressedFile, pathDeCompressedFile, path.extname(compressedFile.name), async (err) => {
          if (err) {
            return res.status(500).send(err);
          }
          try{
            const url = `http://${config.URL_DEV}:${config.PORT_DEV}/api/upload/${newName}`;
            await axios.put(url);
            return res.status(200).json({
              fileName: newName
            });
          } catch(err) {
            logger.error(err);
            return res.status(500).send(err);
          }
        });
      });
    } else {
      return res.status(500).send('The file is not a zip or tar.');
    }
  },

  async update(req, res) {
    if (!req.params.upload) {
      return res.status(400).send('No upload id found.');
    }
    
    const folderName = req.params.upload;
    const pathDeCompressedFile = `${process.env.PWD}/decompressed/${folderName}`;
    if (!(await fs.exists(pathDeCompressedFile))) {
      return res.status(500).json({
        status: 404,
        message: `The ID: ${folderName} is not found.`
      });
    }
    const percentageAcceptedExtensions = await checkAverageExtension(config.EXTENSION_ACCEPTED, pathDeCompressedFile)
    if (percentageAcceptedExtensions > config.PERCENTAGE_ACCEPTED) {
      // @slorenzo: If is an album, I remove other files with different extension.
      try {
        removeFilesExceptExt(config.EXTENSION_ACCEPTED, pathDeCompressedFile);
        return res.status(200).json({
          message: 'The .zip was successfully loaded'
        });
      } catch(err) {
        logger.error(err);
        return res.status(500).send(err);
      }
    } else {
      const url = `http://${config.URL_DEV}:${config.PORT_DEV}/api/upload/${req.params.upload}`;
      try{
        await axios.delete(url);
        return res.status(500).json({
          status: 500,
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
      await fs.unlink(`${process.env.PWD}/compressed/${id}.zip`);
      await fs.rimraf(`${process.env.PWD}/itunes/${id}`);
      await fs.rimraf(`${process.env.PWD}/decompressed/${id}`);
      return res.status(200).json({
        message: `All about ${id} were removed`
      });
    } catch(err) {
      logger.error(err);
      return res.status(500).json(err);
    }
  }
});
