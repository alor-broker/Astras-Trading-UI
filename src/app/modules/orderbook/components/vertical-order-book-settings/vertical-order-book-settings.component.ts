import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output
} from '@angular/core';
import {
  Subject,
  takeUntil
} from "rxjs";
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";
import {
  AbstractControl,
  FormControl,
  FormGroup,
  Validators
} from "@angular/forms";
import { VerticalOrderBookSettings } from "../../../../shared/models/settings/vertical-order-book-settings.model";

interface SettingsFormData {
  depth: number,
  exchange: string,
  symbol: string,
  instrumentGroup: string,
  showYieldForBonds: boolean
}

type SettingsFormControls = { [key in keyof SettingsFormData]: AbstractControl };
type SettingsFormGroup = FormGroup & { value: SettingsFormData, controls: SettingsFormControls };

@Component({
  selector: 'ats-vertical-order-book-settings[settingsChange][guid]',
  templateUrl: './vertical-order-book-settings.component.html',
  styleUrls: ['./vertical-order-book-settings.component.less']
})
export class VerticalOrderBookSettingsComponent implements OnInit, OnDestroy {
  @Input()
  guid!: string;
  @Output()
  settingsChange: EventEmitter<void> = new EventEmitter();

  form!: SettingsFormGroup;
  readonly validationOptions = {
    minDepth: 0,
    maxDepth: 20
  };
  private readonly destroy$: Subject<boolean> = new Subject<boolean>();

  constructor(private readonly settingsService: WidgetSettingsService) {
  }

  ngOnInit() {
    this.settingsService.getSettings<VerticalOrderBookSettings>(this.guid).pipe(
      takeUntil(this.destroy$)
    ).subscribe(settings => {
      this.form = new FormGroup({
        symbol: new FormControl(settings.symbol, [
          Validators.required,
          Validators.minLength(1)
        ]),
        exchange: new FormControl(settings.exchange, Validators.required),
        depth: new FormControl(settings.depth, [Validators.required,
          Validators.min(this.validationOptions.minDepth),
          Validators.max(this.validationOptions.maxDepth)]),
        instrumentGroup: new FormControl(settings.instrumentGroup),
        showYieldForBonds: new FormControl(settings.showYieldForBonds)
      } as SettingsFormControls) as SettingsFormGroup;
    });
  }

  submitForm(): void {
    this.settingsService.updateSettings(
      this.guid,
      {
        ...this.form.value,
        linkToActive: false
      });

    this.settingsChange.emit();
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
  }
}
