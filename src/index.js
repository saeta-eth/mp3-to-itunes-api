import "babel-core/register";
import 'babel-polyfill';

import http from 'http';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import bodyParser from 'body-parser';
import fileUpload from 'express-fileupload';
import path from 'path';

import initializeDb from './db';
import middleware from './middleware';
import api from './api';
import config from './config.json';
import { getFilesFromFolder } from './lib/util';

let app = express();
app.server = http.createServer(app);

// logger
app.use(morgan('dev'));

// 3rd party middleware
app.use(cors({
	exposedHeaders: config.corsHeaders
}));

app.use(bodyParser.json({
	limit : config.bodyLimit
}));

app.use(fileUpload());

app.get('/itunes/:id', async function (req, res) {
  try {
    const files = await getFilesFromFolder(`${process.cwd()}/itunes/${req.params.id}`);
    const fileName = files[0].split('/').pop()
    const extension = path.extname(fileName)
    const fileNameWithoutExt = fileName.split('.')[0]
    res.download(files[0], `${fileNameWithoutExt} (by mp3-to-video)${extension}`);  
  } catch(err) {
    return res.status(500).send(err);
  }
  
});

// connect to db
initializeDb( db => {

	// internal middleware
	app.use(middleware({ config, db }));

	// api router
	app.use('/api', api({ config, db }));

	app.server.listen(process.env.PORT || config.port, () => {
		console.log(`Started on port ${app.server.address().port}`);
	});
});

export default app;
