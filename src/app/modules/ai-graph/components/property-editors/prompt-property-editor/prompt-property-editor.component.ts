import {Component, Input, OnChanges, SimpleChanges} from '@angular/core';
import {StringPropertyEditorComponent} from "../string-property-editor/string-property-editor.component";
import {NodeBase} from "../../../graph/nodes/node-base";
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {NzAutosizeDirective, NzInputDirective, NzTextareaCountComponent} from "ng-zorro-antd/input";
import {NzFormControlComponent, NzFormDirective, NzFormItemComponent, NzFormLabelComponent} from "ng-zorro-antd/form";
import {TranslocoDirective} from "@jsverse/transloco";
import {NzButtonComponent} from "ng-zorro-antd/button";
import {NzIconDirective} from "ng-zorro-antd/icon";
import {NzTooltipDirective} from "ng-zorro-antd/tooltip";

@Component({
    selector: 'ats-prompt-property-editor',
    imports: [
        FormsModule,
        NzAutosizeDirective,
        NzFormControlComponent,
        NzFormDirective,
        NzFormItemComponent,
        NzFormLabelComponent,
        NzInputDirective,
        NzTextareaCountComponent,
        ReactiveFormsModule,
        TranslocoDirective,
        NzButtonComponent,
        NzIconDirective,
        NzTooltipDirective
    ],
    templateUrl: './prompt-property-editor.component.html',
    styleUrl: './prompt-property-editor.component.less'
})
export class PromptPropertyEditorComponent extends StringPropertyEditorComponent implements OnChanges {
  @Input({required: true})
  targetNode!: NodeBase;

  availableInputs: string[] = [];

  ngOnChanges(changes: SimpleChanges): void {
    super.ngOnChanges(changes);
    if(changes.targetNode?.currentValue != null) {
      const node = changes.targetNode.currentValue as NodeBase;
      this.availableInputs = node.inputs.map(i => i.name);
    }
  }

  protected addInputPlaceholder(inputName: string, targetElement: HTMLTextAreaElement): void {
    const currentValue = targetElement.value ?? '';
    const placeholder = '{{' + inputName + '}}';
    const cursorIndex = targetElement.selectionEnd;

    let updatedValue = placeholder;

    if(currentValue.length > 0) {
      const parts: string[] = [];
      if(cursorIndex === 0) {
        parts.push(placeholder);
        parts.push(' ');
        parts.push(currentValue);
      } else if(cursorIndex >= currentValue.length) {
        parts.push(currentValue);
        parts.push(' ');
        parts.push(placeholder);
      } else {
        parts.push(currentValue.slice(0, cursorIndex));
        parts.push(' ');
        parts.push(placeholder);
        parts.push(' ');
        parts.push(currentValue.slice(cursorIndex));
      }

      updatedValue = parts.join('');
    }

    this.form.controls.property.setValue(updatedValue);
    setTimeout(() => {
      targetElement.selectionEnd = cursorIndex + (updatedValue.length - currentValue.length);
    });
  }
}
