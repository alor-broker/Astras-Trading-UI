import {Component} from '@angular/core';
import {PropertyEditorBaseComponent} from "../property-editor-base";
import {BooleanPropertyEditorConfig} from "../../../models/property-editor.model";

@Component({
  selector: 'ats-boolean-property-editor',
  standalone: true,
  imports: [],
  templateUrl: './boolean-property-editor.component.html',
  styleUrl: './boolean-property-editor.component.less'
})
export class BooleanPropertyEditorComponent extends PropertyEditorBaseComponent<BooleanPropertyEditorConfig> {

}
