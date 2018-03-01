import { version } from '../../package.json';
import { Router } from 'express';
import upload from './upload';
import converter from './converter';

export default ({ config, db }) => {
  let api = Router();

  api.use('/upload', upload({ config, db }));
  api.use('/converter', converter({ config, db }));

  // perhaps expose some API metadata at the root
  api.get('/', (req, res) => {
    res.json({ version });
  });

  return api;
}
