export function tryCatch<T, E extends Error>(fn: () => T): T | E {
  try {
    return fn();
  } catch (e) {
    return e as E;
  }
}

// express tryCatch
// https://www.youtube.com/watch?v=mGPj-pCGS2c
