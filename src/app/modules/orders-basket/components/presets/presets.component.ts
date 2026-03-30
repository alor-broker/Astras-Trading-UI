import {Component, ElementRef, input, output, viewChild} from '@angular/core';
import {DataPreset} from "../../models/orders-basket-settings.model";
import {TranslocoDirective} from '@jsverse/transloco';
import {NzTagComponent} from 'ng-zorro-antd/tag';
import {NzTooltipDirective} from 'ng-zorro-antd/tooltip';
import {NzIconDirective} from 'ng-zorro-antd/icon';
import {NzPopconfirmDirective} from 'ng-zorro-antd/popconfirm';
import {NzInputDirective} from 'ng-zorro-antd/input';
import {FormsModule} from '@angular/forms';

@Component({
  selector: 'ats-presets',
  templateUrl: './presets.component.html',
  styleUrls: ['./presets.component.less'],
  imports: [
    TranslocoDirective,
    NzTagComponent,
    NzTooltipDirective,
    NzIconDirective,
    NzPopconfirmDirective,
    NzInputDirective,
    FormsModule
  ]
})
export class PresetsComponent {
  readonly inputElement = viewChild<ElementRef<HTMLInputElement>>('inputElement');

  readonly guid = input.required<string>();

  readonly presets = input.required<DataPreset[]>();

  readonly canAddPreset = input(false);

  inputVisible = false;
  inputValue = '';
  readonly presetSelected = output<DataPreset>();

  readonly addPreset = output<{
    title: string;
}>();

  readonly removePreset = output<DataPreset>();

  sliceTagName(tag: string): string {
    return tag.length > 20
      ? `${tag.slice(0, 20)}...`
      : tag;
  }

  showInput(): void {
    if (!this.canAddPreset()) {
      return;
    }

    this.inputVisible = true;
    setTimeout(() => {
      this.inputElement()?.nativeElement.focus();
    }, 10);
  }

  handleInputConfirm(): void {
    if (this.inputValue.length > 0) {
      this.addPreset.emit({
        title: this.inputValue
      });
    }

    this.inputValue = '';
    this.inputVisible = false;
  }
}
