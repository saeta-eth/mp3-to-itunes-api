import "babel-core/register";
import 'babel-polyfill';

import http from 'http';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import bodyParser from 'body-parser';
import fileUpload from 'express-fileupload';
import path from 'path';
import config from 'dos-config';

import initializeDb from './db';
import middleware from './middleware';
import api from './api';
import { removeFilesMidnight } from './lib/midnight';

let app = express();
app.server = http.createServer(app);

// logger
app.use(morgan('dev'));

// 3rd party middleware
app.use(cors({
  exposedHeaders: config.corsHeaders
}));

app.use(bodyParser.json({limit: config.bodyLimit}));
app.use(bodyParser.urlencoded({
  limit: config.bodyLimit, 
  extended: true, 
  parameterLimit: 50000
}));

app.use(fileUpload());

// connect to db
initializeDb( db => {

  // internal middleware
  app.use(middleware({ config, db }));

	// api router
	app.use('/api', api({ config, db }));

  app.server.listen(config.port, () => {
    console.log(`Started on port ${app.server.address().port}`);
  });
});

removeFilesMidnight();

export default app;
