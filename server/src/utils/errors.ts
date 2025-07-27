export function tryCatch<T, E extends Error>(fn: () => T): T | E {
  try {
    return fn();
  } catch (e) {
    return e as E;
  }
}

export class HttpError extends Error {
  constructor(message: string, public statusCode: number) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
  }
}

// express tryCatch
// https://www.youtube.com/watch?v=mGPj-pCGS2c
