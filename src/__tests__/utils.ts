export const createMockImport = (
  component: jest.Mock<JSX.Element, []>,
  sync: boolean
) => {
  const resolved = { default: component };
  let resolve: any;
  let mockImport;

  if (sync) {
    // This should be the same as the transpiled output from the babel plugin
    const then = (fn: any) => fn(resolved);

    mockImport = { ...resolved, then };
  } else {
    mockImport = new Promise(r => {
      resolve = r;
    });
  }

  const resolveImport = async () => {
    resolve(resolved);

    // let react re-render
    await nextTick();

    return undefined;
  };

  return { mockImport, resolveImport };
};

export const nextTick = () => new Promise(r => setTimeout(r, 0));
