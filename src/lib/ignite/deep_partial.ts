export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export const DeepPartial = {
  merge<T>(base: T, patch: DeepPartial<T>): T {
    const result = { ...base };
    for (const key in patch) {
      const baseValue = (base as any)[key];
      const patchValue = (patch as any)[key];
      if (
        patchValue &&
        typeof patchValue === "object" &&
        !Array.isArray(patchValue)
      ) {
        (result as any)[key] = DeepPartial.merge(baseValue, patchValue);
      } else if (patchValue !== undefined) {
        (result as any)[key] = patchValue;
      }
    }
    return result;
  },
};
