import fs from 'fs';
import { dirname, normalize, relative } from 'path';
import {
  CachedInputFileSystem,
  ResolverFactory,
  ResolveOptions,
  Resolver,
} from 'enhanced-resolve';

function hasRelativePrefix(path: string): boolean {
  return path.substring(0, 2) === './' || path.substring(0, 3) === '../';
}

function addDotSlashPrefix(path: string): string {
  return hasRelativePrefix(path) ? path : `./${path}`;
}

export function createCustomResolver(
  options: Partial<ResolveOptions>
): Resolver {
  return ResolverFactory.createResolver({
    // @ts-expect-error fs != BaseFileSystem
    fileSystem: new CachedInputFileSystem(fs, 4000),
    extensions: ['.tsx', '.ts', '.jsx', '.js'],
    ...options,
    useSyncFileSystemCalls: true,
  });
}

export type GetModulePathOptions = {
  filename: string;
  importPath: string;
  modulePathReplacer: { from: string; to: string } | undefined;
  resolver: Resolver;
};

/**
 * Generates a relative path to the module that should be 1:1 with what the
 * webpack plugin generates for the key for the chunk in the manifest.
 *
 * @param filename - The absolute path to the file being transpiled
 * @param importPath - The import string as it is written in application source code
 * @param modulePathReplacer - Contains from and to string keys to override a specific part of the resulting
 * module paths generated
 * @param resolver - Instance of 'enhanced-resolve' with the custom configuration
 */
export function getModulePath({
  filename,
  importPath,
  modulePathReplacer,
  resolver,
}: GetModulePathOptions): string {
  // Resolve the import path starting from the filename path itself rather than from within this file
  const modulePath = resolver.resolveSync({}, dirname(filename), importPath);

  const path = relative(process.cwd(), String(modulePath));

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
