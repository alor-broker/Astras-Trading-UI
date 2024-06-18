export interface ContextMenu {
  title: string;
  subMenu?: ContextMenu[];
  clickFn?: (...args: any) => void;
}

export interface Filter {
  name: string;
  displayName: string;
}
