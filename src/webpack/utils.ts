import { Compiler, compilation as webpackCompilation } from 'webpack';
import { Manifest } from '../types';
import url from 'url';

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
  moduleImports: Map<string, Set<string>>
): Manifest => {
  const { context } = compiler.options;
  const { chunkGroups } = compilation;

  return (chunkGroups as ChunkGroup[]).reduce<Manifest>((manifest, group) => {
    const { chunks, origins } = group;
    for (const origin of origins) {
      const { module: originModule, request } = origin;
      if (!originModule) {
        continue;
      }

      const { resource } = originModule;
      const rawRequests = moduleImports.get(resource) || new Set();
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
      if (!name || manifest[name]) {
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

          const publicPath = url.resolve(
            compilation.outputOptions.publicPath || '',
            file
          );

          if (!manifest[name]) {
            manifest[name] = [];
          }

          manifest[name].push(publicPath);
        }
      }
    }

    return manifest;
  }, {} as Manifest);
};
