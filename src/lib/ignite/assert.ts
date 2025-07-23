export const Assert = {
  true(condition: boolean, message: string) {
    if (condition) return;

    throw new Error(message);
  },

  defined(obj: any, message: string) {
    if (obj) return;

    throw new Error(message);
  },

  false(condition: boolean, message: string) {
    if (!condition) return;

    throw new Error(message);
  }
}
