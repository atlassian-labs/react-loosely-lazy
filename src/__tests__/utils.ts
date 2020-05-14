export const createMockImport = (
  component: jest.Mock<JSX.Element, []>,
  sync: boolean
) => {
  const resolved = { default: component };
  let resolve: (value: typeof resolved) => void;
  let mockImport;

  if (sync) {
    // This should be the same as the transpiled output from the babel plugin
    const then = (fn: any) => fn(resolved);

    mockImport = { ...resolved, then };
  } else {
    mockImport = new Promise<typeof resolved>(res => {
      resolve = res;
    });
  }

  const resolveImport = async () => {
    resolve(resolved);

    // Let react re-render
    await nextTick();
  };

  return { mockImport, resolveImport };
};

export const nextTick = () => new Promise(r => setTimeout(r, 0));
