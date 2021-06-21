#!/usr/bin/env node

import chalk from 'chalk';
import childProcess from 'child_process';
import { promises } from 'fs';
import { join } from 'path';
import { promisify } from 'util';

import { getPublicPackages, toPackageNamesMap } from './utils.mjs';

const { black, bold } = chalk;
const { copyFile, mkdir } = promises;
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

const buildingText = black.bgYellow(' BUILDING ');
const failedText = black.bgRed('  FAILED  ');
const completeText = black.bgGreen(' COMPLETE ');

const buildPackage = async ([path, packageJson]) => {
  const { name } = packageJson;
  const details = [bold(name)];

  console.log(buildingText, ...details);

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
        --declarationDir ${typesDestination}\
        --declarationMap\
        --emitDeclarationOnly\
        --project ${tsConfig}
    `);
  } catch (err) {
    console.log(failedText, ...details);
    console.log();
    throw err;
  }

  console.log(completeText, ...details);
  console.log();
};

const buildPackages = async publicPackages => {
  for (const entry of publicPackages) {
    await buildPackage(entry);
  }
};

const getSelectedPackages = (packages, packageNames) => {
  const packagesByName = toPackageNamesMap(packages);
  const selectedPackages = new Map();
  const invalidPackages = [];

  for (const packageName of packageNames) {
    if (packagesByName.has(packageName)) {
      const [path, packageJson] = packagesByName.get(packageName);
      selectedPackages.set(path, packageJson);
    } else {
      invalidPackages.push(packageName);
    }
  }

  return [selectedPackages, invalidPackages];
};

const main = async () => {
  const packages = await getPublicPackages();
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
