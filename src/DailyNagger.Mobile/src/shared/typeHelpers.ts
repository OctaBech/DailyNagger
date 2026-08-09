export type Prettify<T> = {
  readonly [TKey in keyof T]: T[TKey];
} & {};

export type Immutable<T> = Prettify<Readonly<T>>;
