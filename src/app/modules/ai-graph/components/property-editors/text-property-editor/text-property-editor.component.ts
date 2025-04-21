import {Component} from '@angular/core';
import {StringPropertyEditorComponent} from "../string-property-editor/string-property-editor.component";
import {NzFormControlComponent, NzFormDirective, NzFormItemComponent, NzFormLabelComponent} from "ng-zorro-antd/form";
import {NzAutosizeDirective, NzInputDirective, NzTextareaCountComponent} from "ng-zorro-antd/input";
import {ReactiveFormsModule} from "@angular/forms";
import {TranslocoDirective} from "@jsverse/transloco";

@Component({
    selector: 'ats-text-property-editor',
    imports: [
        NzFormControlComponent,
        NzFormDirective,
        NzFormItemComponent,
        NzFormLabelComponent,
        NzInputDirective,
        ReactiveFormsModule,
        TranslocoDirective,
        NzAutosizeDirective,
        NzTextareaCountComponent
    ],
    templateUrl: './text-property-editor.component.html',
    styleUrl: './text-property-editor.component.less'
})
export class TextPropertyEditorComponent extends StringPropertyEditorComponent {

}
