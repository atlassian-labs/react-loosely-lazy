import { Reporter } from '@parcel/plugin';
import { join } from 'path';

import { buildManifests } from './utils';

export default new Reporter({
  async report({ event, options }) {
    if (event.type !== 'buildSuccess') {
      return;
    }

    const { bundleGraph } = event;
    const { inputFS, outputFS, projectRoot } = options;

    const config = JSON.parse(
      await inputFS.readFile(join(projectRoot, 'package.json'), 'utf8')
    );

    const { fileName = 'rll-manifest.json' } =
      config['react-loosely-lazy']?.manifest ?? {};

    const manifests = buildManifests({
      bundleGraph,
      options: {
        assetBasePath: outputFS.cwd(),
      },
    });

    await Promise.all(
      [...manifests].map(([targetDir, manifest]) =>
        outputFS.writeFile(
          join(targetDir, fileName),
          JSON.stringify(manifest, null, 2),
          undefined // for TypeScript
        )
      )
    );
  },
});
