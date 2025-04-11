import {INodePropertyInfo} from "@comfyorg/litegraph/dist/LGraphNode";
import {IContextMenuValue} from "@comfyorg/litegraph";
import {EditorType} from "../slot-types";

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

export interface ValidationOptions {
}

export interface StringValueValidationOptions extends ValidationOptions {
  minLength: number;
  maxLength: number;
}

export interface NumberValueValidationOptions extends ValidationOptions {
  required: boolean;
  min?: number;
  max?: number;
  step?: number;
  allowNegative: boolean;
  allowDecimal: boolean;
}

export interface DateValueValidationOptions extends ValidationOptions {
  min: Date;
  allowFuture: boolean;
  required: boolean;
}

export interface PortfolioValueValidationOptions extends ValidationOptions {
  required: boolean;
}

export interface SelectValueValidationOptions extends ValidationOptions {
  required: boolean;
  allowedValues: string[];
}

export interface NodePropertyInfo extends INodePropertyInfo {
  label?: string;
  editorType?: EditorType;
  validation?: ValidationOptions;
}

export interface ContextMenu {
  title?: string;
  items: (IContextMenuValue | null)[];
}
