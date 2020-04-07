export const createMockImport = (value: any, sync: boolean) => {
  let resolve: { (arg0: { default: any }): void; (value?: unknown): void };
  const mockImport = sync
    ? ({
        then: (fn: (arg0: { default: any }) => any) => fn({ default: value }),
      } as any)
    : new Promise(r => {
        resolve = r;
      });

  const resolveImport = async () => {
    resolve({ default: value });

    // let react re-render
    await nextTick();

    return undefined;
  };

  return { mockImport, resolveImport };
};

export const nextTick = () => new Promise(r => setTimeout(r, 0));
