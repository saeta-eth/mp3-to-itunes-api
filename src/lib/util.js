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
  let files = await fs.readdir(path);
  if(files.length) {
    if(files.length === 1 || (files.length === 2 && files.indexOf('__MACOSX') !== -1)) {
      files = await getFilesFromFolder(`${path}/${files[0]}`);
    }

    let filesAccepted = [];
    for (let extension of extensions) {
      for (let file of files) {
        if(file.includes(extension)) {
          filesAccepted.push(file);
        } 
      }
    }

    return filesAccepted.length/files.length;
  }
  return 0
}

export async function removeFilesExceptExt(extensions, path) {
  try{
    const { files, newPath } = await checkFolders(path);
    for (let file of files) {
      const fileExtension = file.split('.').pop();
      if(!extensions.includes(fileExtension)){
        await fs.delete(`${newPath}/${file}`);
      }
    }
  } catch(err) {
    throw new Error(err);
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

export async function checkFolders(path) {
  let files = await fs.readdir(path);
  if(files.length >= 3){
    throw new Error('The folder or file has deeper directories');
  }
  if(files.length) {
    if(files.length === 1 || files.length === 2) {
      if(files.indexOf('__MACOSX') !== -1) {
        await fs.delete(`${path}/__MACOSX`);  
      }
      const newPath = `${path}/${files[0]}`;
      files = await fs.readdir(newPath);

      return {
        files,
        newPath
      }
    }
    return {
      files,
      [newPath] : path
    };
  } else {
    throw new Error('The folder or file does not have files');
  }
}
