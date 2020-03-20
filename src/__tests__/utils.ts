export const createMockImport = (value: any, sync: boolean) => {
  let resolve;
  const mockImport = sync
    ? ({ then: fn => fn({ default: value }) } as any)
    : new Promise(r => {
        resolve = r;
      });

  const resolveImport = async () => {
    resolve({ default: value });

    // let react re-render
    return nextTick();
  };

  return { mockImport, resolveImport };
};

export const nextTick = () => new Promise(r => setTimeout(r, 0));
