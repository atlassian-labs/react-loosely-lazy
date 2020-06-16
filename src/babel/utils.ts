import { dirname, normalize, relative } from 'path';

function hasRelativePrefix(path: string): boolean {
  return path.substring(0, 2) === './' || path.substring(0, 3) === '../';
}

function addDotSlashPrefix(path: string): string {
  return hasRelativePrefix(path) ? path : `./${path}`;
}

export type GetModulePathOptions = {
  filename: string;
  importPath: string;
  modulePathReplacer: { from: string; to: string } | undefined;
};

/**
 * Generates a relative path to the module that should be 1:1 with what the
 * webpack plugin generates for the key for the chunk in the manifest.
 *
 * @param filename - The absolute path to the file being transpiled
 * @param importPath - The import string as it is written in application source code
 * @param modulePathReplacer - Contains from and to string keys to override a specific part of the resulting
 * module paths generated
 */
export function getModulePath({
  filename,
  importPath,
  modulePathReplacer,
}: GetModulePathOptions): string {
  // Resolve the import path starting from the filename path itself rather than from within this file
  const modulePath = require.resolve(importPath, {
    paths: [dirname(filename)],
  });

  const path = relative(process.cwd(), modulePath);

  if (modulePathReplacer) {
    const { from, to } = modulePathReplacer;
    // Normalize the "from" option so that it matches the normalized relative path format and replace it with whatever
    // is in the "to" option
    const normalizedFrom = normalize(from);

    return path.replace(normalizedFrom, to);
  }

  return addDotSlashPrefix(path);
}

export function isPresent<T>(t: T | undefined | null | void): t is T {
  return t !== undefined && t !== null;
}
