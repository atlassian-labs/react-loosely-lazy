import url from 'url';
import { Compiler, compilation as webpackCompilation, Module } from 'webpack';

type Compilation = webpackCompilation.Compilation;

type ModuleExtended = webpackCompilation.Module & {
  libIdent?: (params: { context: any }) => string;
  rootModule?: webpackCompilation.Module;
  rawRequest?: string;
};

type Manifest = { [key: string]: { [key: string]: any } };

type Bundle = {
  id: number | string;
  name: string;
  file: string;
  publicPath: string;
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

        if (
          module.constructor.name === 'ConcatenatedModule' &&
          module.rootModule
        ) {
          currentModule = module.rootModule;
        }

        if (currentModule.rawRequest && !manifest[currentModule.rawRequest]) {
          manifest[currentModule.rawRequest] = [];
        }

        if (
          currentModule.rawRequest &&
          Array.isArray(manifest[currentModule.rawRequest])
        ) {
          manifest[currentModule.rawRequest].push({
            id,
            name,
            file,
            publicPath,
          });
        }
      });
    });
  });

  return manifest;
}

export class ReactLooselyLazyPlugin {
  filename: string;

  constructor(opts: { filename: string } = { filename: '' }) {
    this.filename = opts.filename;
  }

  apply(compiler: Compiler) {
    compiler.plugin('emit', (compilation, callback) => {
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
    });
  }
}

export function getBundleFiles(
  manifest: { [key: string]: any },
  moduleIds: string[]
) {
  return moduleIds
    .reduce((bundles: Bundle[], moduleId: string) => {
      return bundles.concat(manifest[moduleId]);
    }, [])
    .filter(bundle => bundle)
    .filter(bundle => !bundle.file.endsWith('.map'))
    .map(bundle => bundle.file);
}
