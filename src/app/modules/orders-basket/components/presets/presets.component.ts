import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  Output,
  ViewChild
} from '@angular/core';
import { DataPreset } from "../../models/orders-basket-settings.model";

@Component({
  selector: 'ats-presets',
  templateUrl: './presets.component.html',
  styleUrls: ['./presets.component.less']
})
export class PresetsComponent {
  @ViewChild('inputElement', { static: false })
  inputElement?: ElementRef<HTMLInputElement>;

  @Input({ required: true })
  guid!: string;

  @Input({ required: true })
  presets: DataPreset[] = [];

  @Input()
  canAddPreset = false;

  inputVisible = false;
  inputValue = '';
  @Output()
  presetSelected = new EventEmitter<DataPreset>();

  @Output()
  addPreset = new EventEmitter<{ title: string }>();

  @Output()
  removePreset = new EventEmitter<DataPreset>();

  sliceTagName(tag: string): string {
    return tag.length > 20
      ? `${tag.slice(0, 20)}...`
      : tag;
  }

  showInput(): void {
    if(!this.canAddPreset) {
      return;
    }

    this.inputVisible = true;
    setTimeout(() => {
      this.inputElement?.nativeElement.focus();
    }, 10);
  }

  handleInputConfirm(): void {
    if(this.inputValue.length > 0) {
      this.addPreset.emit({
        title: this.inputValue
      });
    }

    this.inputValue = '';
    this.inputVisible = false;
  }
}
