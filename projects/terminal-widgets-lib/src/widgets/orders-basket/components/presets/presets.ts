import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  input,
  output,
  viewChild,
  ViewEncapsulation
} from '@angular/core';
import {TranslocoDirective} from '@jsverse/transloco';
import {NzTagComponent} from 'ng-zorro-antd/tag';
import {NzTooltipDirective} from 'ng-zorro-antd/tooltip';
import {NzIconDirective} from 'ng-zorro-antd/icon';
import {NzPopconfirmDirective} from 'ng-zorro-antd/popconfirm';
import {NzInputDirective} from 'ng-zorro-antd/input';
import {FormsModule} from '@angular/forms';
import {DataPreset} from '@terminal-widgets-lib/widgets/orders-basket/widget-settings.types';

@Component({
  selector: 'ats-presets',
  templateUrl: './presets.html',
  styleUrls: ['./presets.less'],
  imports: [
    TranslocoDirective,
    NzTagComponent,
    NzTooltipDirective,
    NzIconDirective,
    NzPopconfirmDirective,
    NzInputDirective,
    FormsModule
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class Presets {
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
