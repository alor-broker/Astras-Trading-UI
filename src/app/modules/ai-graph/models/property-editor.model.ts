import {NumberValueValidationOptions, StringValueValidationOptions} from "../graph/nodes/models";

export interface PropertyEditorConfig<T = unknown> {
  label: string;
  applyValueCallback: (value: T | null) => void;
  initialValue: T | null;
}

export interface BooleanPropertyEditorConfig extends PropertyEditorConfig<boolean> {
}

export interface NumberPropertyEditorConfig extends PropertyEditorConfig<number> {
  validation: NumberValueValidationOptions;
}

export interface StringPropertyEditorConfig extends PropertyEditorConfig<string> {
  validation: StringValueValidationOptions;
}
