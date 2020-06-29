import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import path from 'path';
import webpack from 'webpack';
import { ReactLooselyLazyPlugin, getAssets } from '../';

const basePath = path.join(__dirname, '__fixtures__');
const manifestFilename = 'manifest.json';

const config = {
  devtool: 'source-map' as const,
  entry: {
    main: path.join(basePath, 'app', 'index.tsx'),
  },
  mode: 'production' as const,
  output: {
    path: path.join(basePath, 'output'),
    filename: '[name].js',
    publicPath: '/output/',
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: {
          loader: 'babel-loader',
          options: {
            babelrc: false,
            presets: [['@babel/preset-env', { modules: false }]],
          },
        },
      },
      {
        test: /\.css$/,
        use: [MiniCssExtractPlugin.loader, 'css-loader'],
      },
    ],
  },
  plugins: [
    new ReactLooselyLazyPlugin({
      filename: manifestFilename,
    }),
    new MiniCssExtractPlugin(),
  ],
  resolve: {
    alias: {
      'custom-alias': path.join(basePath, 'custom-alias'),
      'react-loosely-lazy': path.join(__dirname, '../../'),
    },
    extensions: ['.tsx', '.ts', '.js'],
  },
};

const expectedManifest = {
  './src/webpack/__tests__/__fixtures__/app/ui/concatenated-module/index.tsx': [
    '/output/async-concatenated-module.js',
  ],
  './src/webpack/__tests__/__fixtures__/app/ui/external-assets/index.tsx': [
    '/output/async-external-assets.css',
    '/output/async-external-assets.js',
  ],
  './src/webpack/__tests__/__fixtures__/app/ui/lazy-after-paint.tsx': [
    '/output/async-lazy-after-paint.js',
  ],
  './src/webpack/__tests__/__fixtures__/app/ui/lazy-for-paint.tsx': [
    '/output/async-lazy-for-paint.js',
  ],
  './src/webpack/__tests__/__fixtures__/app/ui/lazy.tsx': [
    '/output/async-lazy.js',
  ],
  './src/webpack/__tests__/__fixtures__/app/ui/multiple-usages.tsx': [
    '/output/async-multiple-usages-one.js',
  ],
  './src/webpack/__tests__/__fixtures__/app/ui/nested-lazy/index.tsx': [
    '/output/async-nested-lazy.js',
  ],
  './src/webpack/__tests__/__fixtures__/app/ui/nested-lazy/main.tsx': [
    '/output/async-inner-nested-lazy.js',
  ],
  './src/webpack/__tests__/__fixtures__/custom-alias/index.tsx': [
    '/output/async-custom-alias.js',
  ],
};

describe('ReactLooselyLazyPlugin', () => {
  it('should create the manifest', done => {
    webpack(config, (err, stats) => {
      if (err) {
        done(err);
      }

      const info = stats.toJson();

      expect(info).toMatchObject({
        errors: [],
        warnings: [],
      });

      const asset = stats.compilation.assets[manifestFilename];
      const manifest = JSON.parse(asset.source());

      expect(manifest).toEqual(expectedManifest);

      done();
    });
  }, 10000);
});

describe('getAssets', () => {
  it('should return the assets based on the moduleIds provided', () => {
    const assets = getAssets(expectedManifest, [
      './src/webpack/__tests__/__fixtures__/app/ui/lazy-after-paint.tsx',
      './src/webpack/__tests__/__fixtures__/app/ui/lazy-for-paint.tsx',
      '404',
    ]);

    expect(assets).toEqual([
      '/output/async-lazy-after-paint.js',
      '/output/async-lazy-for-paint.js',
      undefined,
    ]);
  });
});
