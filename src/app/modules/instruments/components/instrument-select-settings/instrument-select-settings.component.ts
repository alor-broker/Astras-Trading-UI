import {
  AfterViewInit,
  Component,
  DestroyRef,
  ElementRef,
  EventEmitter,
  Input,
  OnInit,
  Output,
  QueryList,
  ViewChildren
} from '@angular/core';
import {
  UntypedFormControl,
  UntypedFormGroup
} from '@angular/forms';
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";
import {
  allInstrumentsColumns,
  InstrumentSelectSettings
} from '../../models/instrument-select-settings.model';
import { BaseColumnId } from "../../../../shared/models/settings/table-settings.model";
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";
import { NzSelectComponent } from "ng-zorro-antd/select";

@Component({
  selector: 'ats-instrument-select-settings',
  templateUrl: './instrument-select-settings.component.html',
  styleUrls: ['./instrument-select-settings.component.less']
})
export class InstrumentSelectSettingsComponent implements OnInit, AfterViewInit {
  settingsForm!: UntypedFormGroup;
  allInstrumentColumns: BaseColumnId[] = allInstrumentsColumns;
  @Input({required: true})
  guid!: string;
  @Output()
  settingsChange: EventEmitter<InstrumentSelectSettings> = new EventEmitter<InstrumentSelectSettings>();

  @ViewChildren(NzSelectComponent) selectsQueryList!: QueryList<NzSelectComponent>;

  constructor(
    private readonly settingsService: WidgetSettingsService,
    private readonly destroyRef: DestroyRef,
    private readonly elementRef: ElementRef
  ) {
  }

  ngOnInit(): void {
    this.settingsService.getSettings<InstrumentSelectSettings>(this.guid).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(settings => {
      this.buildSettingsForm(settings);

      this.settingsForm.valueChanges
        .pipe(
          takeUntilDestroyed(this.destroyRef)
        )
        .subscribe(() => this.removeNativeTitles());
    });
  }

  saveSettings() {
    if (this.settingsForm?.valid) {
      this.settingsService.updateSettings<InstrumentSelectSettings>(
        this.guid,
        {
          ...this.settingsForm.value
        }
      );

      this.settingsChange.emit();
    }
  }

  ngAfterViewInit() {
    this.selectsQueryList.changes.subscribe(() => this.removeNativeTitles());
  }

  selectOpenStateChange(isOpen: boolean) {
    if (isOpen) {
      setTimeout(
        () => document.querySelectorAll('.ant-select-item-option')
          ?.forEach(option => option.removeAttribute('title')),
        0
      );
    }
  }

  removeNativeTitles() {
    setTimeout(
      () => {
        this.elementRef.nativeElement.querySelectorAll('.ant-select-selection-item[title]')
          ?.forEach((item: Element) => item.removeAttribute('title'));
      },
      0
    );
  }

  private buildSettingsForm(currentSettings: InstrumentSelectSettings) {
    this.settingsForm = new UntypedFormGroup({
      instrumentColumns: new UntypedFormControl(currentSettings.instrumentColumns)
    });
  }
}
