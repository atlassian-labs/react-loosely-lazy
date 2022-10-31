import type { Manifest } from '@react-loosely-lazy/manifest';
import { Compiler, compilation as webpackCompilation } from 'webpack';

type Compilation = webpackCompilation.Compilation;
type Module = webpackCompilation.Module;
type Chunk = webpackCompilation.Chunk;

type Dependency = {
  module: ModuleExtended | null;
};

type AsyncDependenciesBlock = DependenciesBlock & {
  module: Module;
  request: string;
};

type DependenciesBlock = {
  blocks: AsyncDependenciesBlock[];
  dependencies: Dependency[];
};

type ModuleExtended = Module &
  DependenciesBlock & {
    libIdent?: (params: { context: any }) => string;
    resource: string;
    rootModule?: Module;
    rawRequest?: string;
  };

type ChunkGroup = {
  chunks: Chunk[];
  origins: OriginRecord[];
};

type OriginRecord = {
  module: ModuleExtended | null;
  request: string;
};

export const buildManifest = (
  compiler: Compiler,
  compilation: Compilation,
  config: {
    moduleImports: Map<string, Set<string>>;
    publicPath: string | undefined;
  }
): Manifest => {
  const { context } = compiler.options;
  const { chunkGroups, outputOptions } = compilation;

  const publicPath = config.publicPath ?? outputOptions.publicPath;

  return (chunkGroups as ChunkGroup[]).reduce<Manifest>(
    (manifest, group) => {
      const { chunks, origins } = group;
      for (const origin of origins) {
        const { module: originModule, request } = origin;
        if (!originModule) {
          continue;
        }

        const { resource } = originModule;
        const rawRequests = config.moduleImports.get(resource) || new Set();
        if (!rawRequests.has(request)) {
          continue;
        }

        const block = originModule.blocks.find(
          b => b.request === request && b.module === originModule
        );

        if (!block) {
          continue;
        }

        const dependency = block.dependencies.find(
          (dep: any) =>
            dep.request === request && dep.originModule === originModule
        );

        if (!dependency) {
          continue;
        }

        const { module } = dependency;
        if (!module || !module.libIdent) {
          continue;
        }

        const name = module.libIdent({ context });
        if (!name || manifest.assets[name]) {
          continue;
        }

        for (const chunk of chunks) {
          if (chunk.isOnlyInitial()) {
            continue;
          }

          for (const file of chunk.files) {
            if (file.endsWith('.map')) {
              continue;
            }

            if (!manifest.assets[name]) {
              manifest.assets[name] = [];
            }

            manifest.assets[name].push(file);
          }
        }
      }

      return manifest;
    },
    { publicPath, assets: {} }
  );
};

export const removeQueryParams = (input: string | undefined) => {
  // When resolving a package with `exports` in the package.json, `enhanced-resolve` will fail
  // match if the import contains a query string. Query strings could be used to pass import
  // meta data in some cases (e.g. Parcel with support for "magic comments")
  if (!input) {
    return input;
  }

  const qsPos = input.indexOf('?');

  if (qsPos !== -1) {
    return input.substring(0, qsPos);
  }

  return input;
};
