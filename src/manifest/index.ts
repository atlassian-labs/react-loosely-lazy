export type Asset = string;

export type Manifest = {
  publicPath: string;
  assets: {
    [id: string]: Asset[];
  };
};

export const getAssetUrlsFromId = (
  manifest: Manifest,
  id: string
): Asset[] | undefined => {
  if (!manifest.assets || !manifest.assets[id]) {
    return;
  }

  return manifest.assets[id].map(asset => `${manifest.publicPath}${asset}`);
};
