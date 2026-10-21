export const flatten = <T extends Array<unknown>>(arr: T) => [].concat(...arr);
