import zip from 'file-zip';
import * as fs from 'async-file';
import * as fsx from 'fs';

export function decompressedFile(pathCompressedFile, pathDeCompressedFile, extension, cb) {
  if (extension === '.zip') {
    zip.unzip(pathCompressedFile, pathDeCompressedFile, cb);
  } else {
    // Another extension.
  }
}

export async function checkAverageExtension(extensions, path) {
  let files = await fs.readdir(path);
  if(files.length) {
    if(files.length === 1 || (files.length === 2 && files.indexOf('__MACOSX') !== -1)) {
      const isFile = fsx.lstatSync(`${path}/${files[0]}`).isFile()
      if(!isFile) {
        files = await getFilesFromFolder(`${path}/${files[0]}`);    
      }
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
  return 0;
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
