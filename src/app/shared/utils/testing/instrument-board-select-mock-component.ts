import {
  Component,
  forwardRef,
  input
} from "@angular/core";
import {
  ControlValueAccessor,
  NG_VALUE_ACCESSOR
} from "@angular/forms";

@Component({
  selector: 'ats-instrument-board-select',
  template: '',
  standalone: true,
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => InstrumentBoardSelectMockComponent),
    multi: true
  }]
})
export class InstrumentBoardSelectMockComponent implements ControlValueAccessor {
  readonly instrument = input<any>();
  readonly placeholder = input<any>();

  registerOnChange(): void {
    return;
  }

  registerOnTouched(): void {
    return;
  }

  setDisabledState(): void {
    return;
  }

  writeValue(): void {
    return;
  }
}
