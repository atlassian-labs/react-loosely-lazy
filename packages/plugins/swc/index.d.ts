export interface ModulePathReplacer {
  from: string;
  to: string;
}

export interface ReactLooselyLazyOptions {
  client?: boolean;
  modulePathReplacer?: ModulePathReplacer;
  noopRedundantLoaders?: boolean;
  root?: string;
}

declare const plugin: {
  (options?: ReactLooselyLazyOptions): any;
};

export default plugin;
