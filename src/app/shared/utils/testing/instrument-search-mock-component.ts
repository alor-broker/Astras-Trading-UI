import {
  Component,
  forwardRef,
  Input
} from "@angular/core";
import {
  ControlValueAccessor,
  NG_VALUE_ACCESSOR
} from "@angular/forms";

@Component({
  selector: 'ats-instrument-search',
  template: '',
  standalone: true,
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => InstrumentSearchMockComponent),
    multi: true
  }]
})
export class InstrumentSearchMockComponent implements ControlValueAccessor {
  @Input() instrument: any;
  @Input() placeholder: any;

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
