/**
 * @jest-environment node
 */
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import path from 'path';
import webpack, { Stats } from 'webpack';
import { Manifest, ReactLooselyLazyPlugin } from '../';

describe('ReactLooselyLazyPlugin', () => {
  const testPlugin = async ({ publicPath }: { publicPath?: string } = {}) => {
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
          publicPath,
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

    type WebpackOutput = {
      manifest: Manifest;
      stats: Stats.ToJsonOutput;
    };

    const result = await new Promise<WebpackOutput>((resolve, reject) => {
      webpack(config, (err, stats) => {
        if (err) reject(err);

        const asset = stats.compilation.assets[manifestFilename];
        resolve({
          manifest: JSON.parse(asset.source()),
          stats: stats.toJson(),
        });
      });
    });

    const expectedManifest = {
      publicPath: publicPath ?? '/output/',
      assets: {
        './src/webpack/__tests__/__fixtures__/app/ui/concatenated-module/index.tsx': [
          'async-concatenated-module.js',
        ],
        './src/webpack/__tests__/__fixtures__/app/ui/external-assets/index.tsx': [
          'async-external-assets.css',
          'async-external-assets.js',
        ],
        './src/webpack/__tests__/__fixtures__/app/ui/lazy-after-paint.tsx': [
          'async-lazy-after-paint.js',
        ],
        './src/webpack/__tests__/__fixtures__/app/ui/lazy-for-paint.tsx': [
          'async-lazy-for-paint.js',
        ],
        './src/webpack/__tests__/__fixtures__/app/ui/lazy.tsx': [
          'async-lazy.js',
        ],
        './src/webpack/__tests__/__fixtures__/app/ui/multiple-usages.tsx': [
          'async-multiple-usages-one.js',
        ],
        './src/webpack/__tests__/__fixtures__/app/ui/nested-lazy/index.tsx': [
          'async-nested-lazy.js',
        ],
        './src/webpack/__tests__/__fixtures__/app/ui/nested-lazy/main.tsx': [
          'async-inner-nested-lazy.js',
        ],
        './src/webpack/__tests__/__fixtures__/custom-alias/index.tsx': [
          'async-custom-alias.js',
        ],
      },
    };

    const { manifest, stats } = result;

    expect(stats).toMatchObject({
      errors: [],
      warnings: [],
    });

    expect(manifest).toEqual(expectedManifest);
  };

  describe('should create the manifest', () => {
    it('using the default options', async () => {
      await testPlugin();
    });

    it('with an overridden publicPath when it is provided', async () => {
      await testPlugin({
        publicPath: 'https://cdn.example.com/',
      });
    });
  });
});
