/* eslint-disable @typescript-eslint/no-explicit-any */

export const omitKeys = (obj: any, keys: any) => {
  const newObj = { ...obj };
  keys.forEach((key: string | number) => delete newObj[key]);
  return newObj;
};
