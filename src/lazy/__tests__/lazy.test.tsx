import { lazyForPaint } from '..';
import { isNodeEnvironment } from '../../utils';

jest.mock('../../utils', () => ({
  ...jest.requireActual('../../utils'),
  isNodeEnvironment: jest.fn(),
}));

describe('lazy', () => {
  describe('LazyComponent', () => {
    (isNodeEnvironment as any).mockImplementation(() => true);
    const mockModuleId = '@foo/bar';
    const lazyComponent = lazyForPaint(
      // @ts-ignore - mocking import()
      () => Promise.resolve({ default: mockModuleId }),
      {
        getCacheId: () => '',
        moduleId: mockModuleId,
      }
    );

    describe('getBundleUrl', () => {
      it('should find the module file in the supplied manifest', () => {
        const file = 'https://cdn.com/@foo/bar.js';
        const mockManifest = {
          '@foo/bar': {
            file,
            id: 0,
            name: '',
            publicPath: '',
          },
        };

        expect(lazyComponent.getBundleUrl(mockManifest)).toEqual(file);
      });
    });
  });
});
