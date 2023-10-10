export class CustomIteratorWrapper<T> implements Iterable<T> {
  constructor(private readonly factory: () => Iterator<T>) {
  }

  [Symbol.iterator](): Iterator<T> {
    return this.factory();
  }

}

export class ArrayReverseIterator<T> implements Iterator<T> {
  private currentIndex?: number;

  constructor(private readonly source: T[]) {
  }

  next(): IteratorResult<T, null> {
    if (this.currentIndex == null) {
      this.currentIndex = this.source.length;
    }

    this.currentIndex--;

    if (this.currentIndex < 0) {
      return {
        done: true,
        value: null
      };
    }

    return {
      done: false,
      value: this.source[this.currentIndex]
    };
  }
}
