#!/usr/bin/env node

import chalk from 'chalk';
import childProcess from 'child_process';
import { promises } from 'fs';
import { join } from 'path';
import { URL, fileURLToPath } from 'url';
import { promisify } from 'util';

const { black, bold } = chalk;
const { copyFile, readFile, mkdir } = promises;
const exec = promisify(childProcess.exec);

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
    const destination = join(path, 'dist');

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
    await exec(`
      tsc\
        --declaration\
        --declarationMap\
        --declarationDir ${typesDestination}\
        --emitDeclarationOnly\
        --project ${tsConfig}
    `);
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

const getPackages = async paths => {
  const packages = await Promise.all(
    paths.map(path =>
      readFile(join(path, 'package.json'), 'utf-8').then(str => {
        const pkg = JSON.parse(str);

        return [pkg.name, path];
      })
    )
  );

  return new Map(packages);
};

const getSelectedPackages = (packages, packageNames) => {
  const selectedPackages = new Map();
  const invalidPackages = [];

  for (const packageName of packageNames) {
    if (packages.has(packageName)) {
      selectedPackages.set(packageName, packages.get(packageName));
    } else {
      invalidPackages.push(packageName);
    }
  }

  return [selectedPackages, invalidPackages];
};

const main = async () => {
  const rootPath = fileURLToPath(new URL('..', import.meta.url));
  const packagePaths = [
    'packages/core/manifest',
    'packages/core/react-loosely-lazy',
    'packages/plugins/babel',
    'packages/plugins/webpack',
  ].map(path => join(rootPath, path));

  const packages = await getPackages(packagePaths);
  const packageNames = process.argv.slice(2);
  if (!packageNames.length) {
    // Build every package
    return buildPackages(packages);
  }

  const [selectedPackages, invalidPackages] = getSelectedPackages(
    packages,
    packageNames
  );
  if (invalidPackages.length) {
    throw new Error(
      `Unable to build the following packages: ${invalidPackages.join(', ')}`
    );
  }

  return buildPackages(selectedPackages);
};

main().catch(err => {
  process.exitCode = 1;
  console.error(err);
});
