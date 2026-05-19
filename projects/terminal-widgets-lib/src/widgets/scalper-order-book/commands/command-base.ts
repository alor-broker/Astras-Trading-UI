export abstract class CommandBase<T> {
  abstract execute(args: T): void;
}
