#!/usr/bin/env node

import chalk from 'chalk';
import childProcess from 'child_process';
import { promises } from 'fs';
import { join } from 'path';
import semver from 'semver';
import { promisify } from 'util';

import { getPackages, toPackageNamesMap } from './utils.mjs';

const { black, bold, dim } = chalk;
const { writeFile } = promises;
const { minVersion } = semver;
const exec = promisify(childProcess.exec);

const versioningText = black.bgYellow(' VERSIONING ');
const updatingText = black.bgYellow('  UPDATING  ');
const skippedText = black.bgWhite('  SKIPPING  ');
const failedText = black.bgRed('   FAILED   ');
const completeText = black.bgGreen('  COMPLETE  ');

const updateVersion = async version => {
  console.log(versioningText, bold('workspaces'), dim(version));
  // Run the default version command for all workspaces
  await exec(`npm version ${version} --workspaces`);
  console.log(completeText, bold('workspaces'), dim(version));
};

const getNextPackageJson = (packageJson, packagesByName) => {
  if (
    !packageJson.dependencies &&
    !packageJson.devDependencies &&
    !packageJson.peerDependencies
  ) {
    return;
  }

  let nextPackageJson;
  const dependencyKeys = [
    'dependencies',
    'devDependencies',
    'peerDependencies',
  ];

  for (const dependencyKey of dependencyKeys) {
    for (const [dependency, versionRange] of Object.entries(
      packageJson[dependencyKey] ?? {}
    )) {
      if (!packagesByName.has(dependency)) {
        continue;
      }

      const { version } = minVersion(versionRange);
      if (!version) {
        throw new Error('Unable to find version for range', versionRange);
      }

      const [, { version: nextVersion }] = packagesByName.get(dependency);

      if (!nextPackageJson) {
        nextPackageJson = Object.assign({}, packageJson);
      }

      nextPackageJson[dependencyKey][dependency] = versionRange.replace(
        version,
        nextVersion
      );
    }
  }

  return nextPackageJson;
};

const updatePackageDependencies = async packages => {
  const packagesByName = toPackageNamesMap(packages);

  let i = 0;
  for (const [path, packageJson] of packages) {
    const { name } = packageJson;
    const details = [bold(name), dim('package.json')];

    console.log(updatingText, ...details);

    try {
      const nextPackageJson = getNextPackageJson(packageJson, packagesByName);
      if (nextPackageJson) {
        await writeFile(
          join(path, 'package.json'),
          `${JSON.stringify(nextPackageJson, null, 2)}\n`
        );
        console.log(completeText, ...details);
      } else {
        console.log(skippedText, ...details);
      }
    } catch (err) {
      console.log(failedText, ...details);
      console.log();

      throw err;
    }

    if (i < packages.size - 1) {
      console.log();
    }

    i += 1;
  }
};

const updatePackageLockJson = async () => {
  console.log(updatingText, bold('package-lock.json'));
  await exec('npm install');
  console.log(completeText, bold('package-lock.json'));
};

const main = async () => {
  const version = process.argv.slice(2);

  await updateVersion(version);
  console.log();
  await updatePackageDependencies(await getPackages());
  console.log();
  await updatePackageLockJson();
};

main().catch(err => {
  process.exitCode = 1;
  console.error(err);
});
