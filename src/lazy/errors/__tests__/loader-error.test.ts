import { LoaderError, isLoaderError } from '../loader-error';

describe('LoaderError', () => {
  it('returns an error object that contains the correct name, message, native error, and stack', () => {
    const error = new Error('Error');
    const loaderError = new LoaderError('foo', error);

    expect(loaderError).toMatchObject({
      message: 'Failed to load module foo',
      name: 'LoaderError',
      nativeError: error,
    });
    expect(loaderError.stack).toMatch(
      /^LoaderError: Failed to load module foo/
    );
  });
});

describe('isLoaderError', () => {
  it('returns true when given an error of type LoaderError', () => {
    const loaderError = new LoaderError('foo', new Error(''));
    expect(isLoaderError(loaderError)).toBe(true);
  });

  it('returns false when given an error of type Error', () => {
    const error = new Error('');
    expect(isLoaderError(error)).toBe(false);
  });

  it('returns false when given an error of type TypeError', () => {
    const error = new TypeError("Cannot read property 'foo' of null");
    expect(isLoaderError(error)).toBe(false);
  });

  it('returns false when given an error of type SyntaxError', () => {
    const error = new SyntaxError('Unexpected identifier');
    expect(isLoaderError(error)).toBe(false);
  });
});
