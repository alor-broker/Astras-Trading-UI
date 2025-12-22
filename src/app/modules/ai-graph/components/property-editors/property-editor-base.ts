import {Component, input} from "@angular/core";
import {PropertyEditorConfig} from "../../models/property-editor.model";

@Component({
    template: "",
    standalone: false
})
export abstract class PropertyEditorBaseComponent<T extends PropertyEditorConfig<any>> {
  readonly config = input.required<PropertyEditorConfig>();

  protected getTypedConfig(): T {
    return this.config() as T;
  }
}
