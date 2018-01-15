import unzipper from 'unzipper';
//import tar from 'tar-fs';
import * as fs from 'async-file';
import * as fsx from 'fs';

/**	Creates a callback that proxies node callback style arguments to an Express Response object.
 *	@param {express.Response} res	Express HTTP Response
 *	@param {number} [status=200]	Status code to send on success
 *
 *	@example
 *		list(req, res) {
 *			collection.find({}, toRes(res));
 *		}
 */
export function toRes(res, status = 200) {
	return (err, thing) => {
		if (err) return res.status(500).send(err);

		if (thing && typeof thing.toObject === 'function') {
			thing = thing.toObject();
		}
		res.status(status).json(thing);
	};
}

export function decompressedFile(pathCompressedFile, pathDeCompressedFile, extension, cb) {
  if (extension === '.zip') {
    fsx.createReadStream(pathCompressedFile).pipe(unzipper.Extract({ path: pathDeCompressedFile }))
      .on('close', () => {
        cb();
      })
      .on('error', (err) => {
        cb(err);
      });
  } else {
    // Another extension.
  }
}

export async function checkAverageExtension(extensions, path) {
  const files = await fs.readdir(path);
  let filesAccepted = [];
  if(files.length) {
    for (let file of files) {
      for (let extension of extensions) {
        if(file.indexOf(extension) !== -1) {
          filesAccepted.push(file);
        }
      } 
    }

    return filesAccepted.length/files.length;
  }

  return 0;
}

export async function removeFilesExceptExt(extensions, path) {
  const files = await fs.readdir(path);
  for (let file of files) {
    for (let extension of extensions) {
      if(file.indexOf(extension) === -1) {
        await fs.delete(`${path}/${file}`);
      } 
    }
  }
}

export async function checkEmptyFolder(path) {
  const files = await fs.readdir(path);
  return (files.length === 0)
}

export async function getFilesFromFolder(path) {
  const files = await fs.readdir(path);
  return files.map((file) => {
    return `${path}/${file}`;
  });
}
