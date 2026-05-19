import type { en } from "./dictionaries/en";

/**
 * Recursively widen literal string types to plain `string`.
 *
 * We define the English dictionary with `as const` so editors get
 * autocomplete on translation *keys*, but we don't want the *values* to be
 * locked to the exact English wording — otherwise no other locale could
 * compile. `Widen<typeof en>` keeps the key structure and types only as
 * `string`, which is exactly what we want.
 */
type Widen<T> = T extends string
  ? string
  : T extends readonly (infer U)[]
    ? Widen<U>[]
    : T extends object
      ? { [K in keyof T]: Widen<T[K]> }
      : T;

export type Dictionary = Widen<typeof en>;
