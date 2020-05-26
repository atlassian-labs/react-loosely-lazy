import { lstatSync } from 'fs';
import { dirname, relative } from 'path';

function hasDotSlashPrefix(path: string): boolean {
  return path.substring(0, 2) === './';
}

function addDotSlashPrefix(path: string): string {
  return hasDotSlashPrefix(path) ? path : `./${path}`;
}

function removeDotSlashPrefix(path: string): string {
  return hasDotSlashPrefix(path) ? path.replace('./', '') : path;
}

function withModuleExtension(filePath: string): string {
  const extensions = ['.js', '.ts', '.tsx'];
  const extension = extensions.find(ext => {
    try {
      return lstatSync(`${filePath}${ext}`).isFile();
    } catch {
      return false;
    }
  });

  if (!extension) {
    throw new Error(`Error: ${filePath}${extension} does not exist`);
  }

  return `${filePath}${extension}`;
}

/**
 * Generates a relative path to the module that should be 1:1 with what the
 * webpack plugin generates for the key for the chunk in the manifest.
 *
 * @param importSpecifier - The import string as it is written in application source code
 * @param filename - The absolute path to the file being transpiled
 * @param modulePathReplacer - Contains from and to string keys to override a specific part of the resulting
 * module paths generated
 */
export function getModulePath(
  importSpecifier: string,
  filename: string,
  modulePathReplacer: { from: string; to: string } | undefined
): string {
  const filePath = `${dirname(filename)}/${removeDotSlashPrefix(
    importSpecifier
  )}`;
  let modulePath;

  // App dependency import eg., import('my-dependency') where my-dependency is a dependency in package.json
  try {
    modulePath = require.resolve(importSpecifier);
  } catch {
    try {
      const isDirectory = lstatSync(filePath).isDirectory();

      // module entry import eg., import('./module') where module has index file
      if (isDirectory) {
        modulePath = withModuleExtension(`${filePath}/index`);
      }
    } catch {
      // We handle this below
    }
  }

  if (!modulePath) {
    // Relative import eg., import('./async') which is relative to the file being transpiled ie., filename
    modulePath = withModuleExtension(filePath);
  }

  const path = addDotSlashPrefix(relative(process.cwd(), modulePath));

  if (modulePathReplacer) {
    const { from, to } = modulePathReplacer;

    return path.replace(from, to);
  }

  return path;
}

export function isPresent<T>(t: T | undefined | null | void): t is T {
  return t !== undefined && t !== null;
}
