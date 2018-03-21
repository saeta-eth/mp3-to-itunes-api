import zip from 'file-zip';
import * as fs from 'async-file';
import * as fsx from 'fs';
import junk from 'junk';
import path from 'path';

export function decompressedFile(pathCompressedFile, pathDeCompressedFile, extension, cb) {
  if (extension === '.zip') {
    zip.unzip(pathCompressedFile, pathDeCompressedFile, cb);
  } else {
    // Another extension.
  }
}

export async function checkAverageExtension(extensions, folder) {
  let files = await fs.readdir(folder);
  let filesFiltered = files.filter(junk.not);
  if(filesFiltered.length) {
    if (filesFiltered.length === 1) {
      const isDirectory = fsx.lstatSync(`${folder}/${filesFiltered[0]}`).isDirectory();
      if(isDirectory) {
        filesFiltered = await getFilesFromFolder(`${folder}/${filesFiltered[0]}`);    
      }

      let filesAccepted = [];
      for (let extension of extensions) {
        for (let file of filesFiltered) {
          if(file.includes(extension)) {
            filesAccepted.push(file);
          } 
        }
      }

      return filesAccepted.length/filesFiltered.length;
    } else {
      throw new Error('The folder or file has deeper directories');
    }
  }
  return 0;
}

export async function removeFilesExceptExt(extensions, folder) {
  try{
    const { files, pathFolder } = await checkFolder(folder);
    for (let file of files) {
      const fileExtension = path.parse(file).ext;
      if(!extensions.includes(fileExtension)){
        await fs.delete(`${pathFolder}/${file}`);
      }
    }
  } catch(err) {
    throw new Error(err);
  }
}

export async function checkEmptyFolder(pathFolder) {
  const files = await fs.readdir(pathFolder);
  return (files.length === 0)
}

export async function getFilesFromFolder(pathFolder) {
  const files = await fs.readdir(pathFolder);
  const filesFiltered = files.filter(junk.not);
  return filesFiltered.map((file) => {
    return `${pathFolder}/${file}`;
  });
}

export async function checkFolder(pathFolder) {
  let files = await fs.readdir(pathFolder);
  const filesFiltered = files.filter(junk.not);
  if (filesFiltered.length) {
    if (filesFiltered.length === 1) {
      pathFolder = `${pathFolder}/${files[0]}`;
      files = await fs.readdir(pathFolder);      
    }
    return {
      files,
      pathFolder
    }
  } else {
    throw new Error('The folder or file does not have files');
  }
}
