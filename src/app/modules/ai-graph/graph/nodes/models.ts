import {INodePropertyInfo} from "@comfyorg/litegraph/dist/LGraphNode";
import {IContextMenuValue} from "@comfyorg/litegraph";

export interface NodeSlotOptions {
  label?: string;
  removable?: boolean;
  nameLocked?: boolean;
}

export interface OutputDataObject {
  toToolTip?(): string;
}

export enum OutputFormat {
  Markdown = 'markdown',
}

export interface NodePropertyInfo extends INodePropertyInfo {
  label?: string;
}

export interface ContextMenu {
  title?: string;
  items: (IContextMenuValue | null)[];
}
