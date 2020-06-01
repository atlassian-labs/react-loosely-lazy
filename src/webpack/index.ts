import url from 'url';
import { Compiler, compilation as webpackCompilation } from 'webpack';

type Compilation = webpackCompilation.Compilation;

type ModuleExtended = webpackCompilation.Module & {
  libIdent?: (params: { context: any }) => string;
  rootModule?: webpackCompilation.Module;
  rawRequest?: string;
};

export type Manifest = { [key: string]: Bundle };

export type Bundle = {
  id: number | string | null;
  file: string;
  name: string | null;
  publicPath: string;
};

export type ReactLooselyLazyPluginOptions = {
  filename: string;
};

function buildManifest(compiler: Compiler, compilation: Compilation) {
  const { context } = compiler.options;
  const manifest: Manifest = {};

  compilation.chunks.forEach((chunk: webpackCompilation.Chunk) => {
    chunk.files.forEach(file => {
      chunk.getModules().forEach((module: ModuleExtended) => {
        const id = module.id;
        const name =
          typeof module.libIdent === 'function'
            ? module.libIdent({ context })
            : null;
        const publicPath = url.resolve(
          compilation.outputOptions.publicPath || '',
          file
        );
        let currentModule = module;

        if (!name) {
          return;
        }

        if (
          module.constructor.name === 'ConcatenatedModule' &&
          module.rootModule
        ) {
          currentModule = module.rootModule;
        }

        if (
          currentModule.rawRequest &&
          !manifest[name] &&
          !file.endsWith('.map')
        ) {
          manifest[name] = {
            id,
            name,
            file,
            publicPath,
          };
        }
      });
    });
  });

  return manifest;
}

export class ReactLooselyLazyPlugin {
  filename: string;

  constructor(opts: ReactLooselyLazyPluginOptions) {
    this.filename = opts.filename;
  }

  apply(compiler: Compiler) {
    compiler.hooks.emit.tapAsync(
      ReactLooselyLazyPlugin.name,
      (compilation, callback) => {
        const manifest = buildManifest(compiler, compilation);
        const json = JSON.stringify(manifest, null, 2);

        compilation.assets[this.filename] = {
          source() {
            return json;
          },
          size() {
            return json.length;
          },
        };

        callback();
      }
    );
  }
}

export const getBundleFiles = (manifest: Manifest, moduleIds: string[]) =>
  moduleIds.map(id => manifest[id].file);
