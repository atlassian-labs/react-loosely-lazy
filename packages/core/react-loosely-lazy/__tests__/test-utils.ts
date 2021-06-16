import { createDefaultServerImport } from '../src/lazy/__tests__/test-utils';

export const createMockImport = (
  component: jest.Mock<JSX.Element, []>,
  sync: boolean
) => {
  const resolved = { default: component };
  let resolve: (value: typeof resolved) => void;
  let mockImport;

  if (sync) {
    mockImport = createDefaultServerImport({ DefaultComponent: component });
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
