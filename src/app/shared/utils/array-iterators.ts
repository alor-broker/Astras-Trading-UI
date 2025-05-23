export class CustomIteratorWrapper<T> implements Iterable<T> {
  constructor(private readonly factory: () => Iterator<T>) {
  }

  [Symbol.iterator](): Iterator<T> {
    return this.factory();
  }
}
