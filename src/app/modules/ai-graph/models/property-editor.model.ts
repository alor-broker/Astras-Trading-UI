import {
  DateValueValidationOptions,
  NumberValueValidationOptions, PortfolioValueValidationOptions, SelectValueValidationOptions,
  StringValueValidationOptions
} from "../graph/nodes/models";
import {PortfolioKey} from "../graph/slot-types";

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

export interface DatePropertyEditorConfig extends PropertyEditorConfig<Date> {
  validation: DateValueValidationOptions;
}

export interface PortfolioPropertyEditorConfig extends PropertyEditorConfig<PortfolioKey> {
  validation: PortfolioValueValidationOptions;
}

export interface SelectPropertyEditorConfig extends PropertyEditorConfig<string> {
  validation: SelectValueValidationOptions;
}
