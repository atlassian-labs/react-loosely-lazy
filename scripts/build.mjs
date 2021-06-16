#!/usr/bin/env node

import chalk from 'chalk';
import childProcess from 'child_process';
import { promises } from 'fs';
import { join } from 'path';
import { URL, fileURLToPath } from 'url';
import { promisify } from 'util';

const { black, bold } = chalk;
const { copyFile, mkdir } = promises;
const exec = promisify(childProcess.exec);

const rootPath = fileURLToPath(new URL('..', import.meta.url));

const copyFlowTypes = async (source, destination) => {
  try {
    await copyFile(
      join(source, 'index.js.flow'),
      join(destination, 'index.js.flow')
    );
  } catch (err) {
    if (err.code !== 'ENOENT') {
      throw err;
    }
  }
};

const buildPackage = async ({ name, path }) => {
  console.log(black.bgYellow(' BUILDING '), bold(name));

  try {
    const source = join(path, 'src');
    const destination = join(rootPath, 'dist', name);

    await mkdir(destination).catch(() => {});

    const cjsDestination = `${destination}/cjs`;
    await exec(`
      BABEL_ENV=production:cjs babel ${source}\
        --extensions ".ts,.tsx"\
        --out-dir ${cjsDestination}
    `);
    await copyFlowTypes(source, cjsDestination);

    const esmDestination = `${destination}/esm`;
    await exec(`
      BABEL_ENV=production:esm babel ${source}\
        --extensions ".ts,.tsx"\
        --out-dir ${esmDestination}
    `);
    await copyFlowTypes(source, esmDestination);

    const typesDestination = join(destination, 'types');
    const tsConfig = join(path, 'tsconfig.json');
    try {
      await exec(`
        tsc\
          --declaration\
          --declarationMap\
          --declarationDir ${typesDestination}\
          --emitDeclarationOnly\
          --project ${tsConfig}
      `);
    } catch (err) {
      // We don't care if the type cannot be found, as it still gets built
      if (
        // TODO Use !err.stdout?.includes once on node 16
        !err.stdout ||
        !err.stdout.includes("Cannot find module 'react-loosely-lazy/manifest'")
      ) {
        throw err;
      }
    }
  } catch (err) {
    console.log(black.bgRed('  FAILED  '), bold(name));
    console.log();
    throw err;
  }

  console.log(black.bgGreen(' COMPLETE '), bold(name));
  console.log();
};

const buildPackages = async packages => {
  for (const [name, path] of packages) {
    await buildPackage({ name, path });
  }
};

const main = async () => {
  const packages = [
    ['manifest', 'packages/core/manifest'],
    ['react-loosely-lazy', 'packages/core/react-loosely-lazy'],
    ['babel-plugin', 'packages/plugins/babel'],
    ['webpack-plugin', 'packages/plugins/webpack'],
  ].map(([name, path]) => [name, join(rootPath, path)]);

  return buildPackages(packages);
};

main().catch(err => {
  process.exitCode = 1;
  console.error(err);
});
