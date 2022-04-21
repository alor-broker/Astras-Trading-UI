import { AbstractControl, FormGroup } from "@angular/forms";
import { LimitFormData } from "./limit-form-data.model";
import { MarketFormData } from "./market-form-data.model";
import { StopFormData } from "./stop-form-data.model";

export type StopFormControls = { [key in keyof StopFormData]: AbstractControl };
export type StopFormGroup = FormGroup & { value: StopFormData, controls: StopFormControls };

export type LimitFormControls = { [key in keyof LimitFormData]: AbstractControl };
export type LimitFormGroup = FormGroup & { value: LimitFormData, controls: LimitFormControls };

export type MarketFormControls = { [key in keyof MarketFormData]: AbstractControl };
export type MarketFormGroup = FormGroup & { value: MarketFormData, controls: MarketFormControls };
