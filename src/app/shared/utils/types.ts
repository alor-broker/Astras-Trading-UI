export type OptionalProperty<T, K extends keyof T> = Pick<Partial<T>, K> & Omit<T, K>;
