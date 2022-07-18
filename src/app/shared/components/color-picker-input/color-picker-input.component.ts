import {
  Component,
  EventEmitter,
  Input,
  Output
} from '@angular/core';

@Component({
  selector: 'ats-color-picker-input',
  templateUrl: './color-picker-input.component.html',
  styleUrls: ['./color-picker-input.component.less']
})
export class ColorPickerInputComponent {
  @Input()
  value: string = '';

  @Output()
  colorChangeComplete = new EventEmitter<string>();
}
