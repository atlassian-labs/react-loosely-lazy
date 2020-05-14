export class LoaderError extends Error {
  public readonly nativeError: Error;

  constructor(id: string, error: Error) {
    super();
    this.message = `Failed to load module ${id}`;
    this.name = 'LoaderError';
    this.nativeError = error;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, LoaderError);
    }
  }
}

export const isLoaderError = (error: Error) => error instanceof LoaderError;
