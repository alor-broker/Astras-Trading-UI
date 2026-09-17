import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  ViewEncapsulation
} from '@angular/core';
import {WidgetSettingsBase} from '../../../../common/widget-settings.base';
import {
  watchlistColumns,
  WatchlistsWidgetSettings
} from '@terminal-widgets-lib/widgets/watchlists/widget-settings.types';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import {TimeframeValue} from '@terminal-core-lib/common/types/timeframe.types';
import {
  BaseColumnId,
  TableDisplaySettings
} from '@terminal-core-lib/features/tables/types/table-display-settings.types';
import {Observable} from 'rxjs';
import {TableSettingHelper} from '@terminal-core-lib/features/tables/utils/table-settings.helper';
import {WidgetInstance} from '@terminal-core-lib/features/dashboard/types/dashboard-item.types';
import {WidgetSettingsEditor} from '@terminal-widgets-lib/common/features/settings-editor/components/widget-settings-editor/widget-settings-editor';
import {WidgetSettingsGroup} from '@terminal-widgets-lib/common/features/settings-editor/components/widget-settings-group/widget-settings-group';
import {WidgetSettingsForm} from '@terminal-widgets-lib/common/features/settings-editor/components/widget-settings-form/widget-settings-form';
import {WidgetSettingsFormItem} from '@terminal-widgets-lib/common/features/settings-editor/components/widget-settings-form-item/widget-settings-form-item';
import {WidgetSettingsSwitch} from '@terminal-widgets-lib/common/features/settings-editor/components/widget-settings-switch/widget-settings-switch';
import {TranslocoDirective} from '@jsverse/transloco';
import {
  NzOptionComponent,
  NzSelectComponent
} from 'ng-zorro-antd/select';
import {RemoveSelectTitles} from '@terminal-core-lib/common/directives/remove-select-titles';
import {NzTooltipDirective} from 'ng-zorro-antd/tooltip';
import {WatchlistCollectionEdit} from '@terminal-widgets-lib/widgets/watchlists/components/watchlist-collection-edit/watchlist-collection-edit';

@Component({
  selector: 'ats-watchlist-settings',
  imports: [
    WidgetSettingsEditor,
    WidgetSettingsGroup,
    WidgetSettingsForm,
    WidgetSettingsFormItem,
    WidgetSettingsSwitch,
    TranslocoDirective,
    ReactiveFormsModule,
    NzSelectComponent,
    RemoveSelectTitles,
    NzOptionComponent,
    NzTooltipDirective,
    WatchlistCollectionEdit
  ],
  templateUrl: './watchlist-settings.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WatchlistSettings extends WidgetSettingsBase<WatchlistsWidgetSettings> {
  readonly widgetInstance = input.required<WidgetInstance>();

  allInstrumentColumns: BaseColumnId[] = watchlistColumns;

  readonly priceChangeTimeFrames = [
    {name: 'S1', value: TimeframeValue.S1},
    {name: 'S5', value: TimeframeValue.S5},
    {name: 'S10', value: TimeframeValue.S10},
    {name: 'M1', value: TimeframeValue.M1},
    {name: 'M5', value: TimeframeValue.M5},
    {name: 'M15', value: TimeframeValue.M15},
    {name: 'H', value: TimeframeValue.H},
    {name: 'H4', value: TimeframeValue.H4},
    {name: 'Day', value: TimeframeValue.Day},
    {name: 'W', value: TimeframeValue.W},
    {name: 'Month', value: TimeframeValue.Month}
  ];

  protected settings$!: Observable<WatchlistsWidgetSettings>;

  private readonly formBuilder = inject(FormBuilder);

  readonly settingsForm = this.formBuilder.group({
    display: this.formBuilder.group({
      instrumentColumns: this.formBuilder.nonNullable.control<string[]>([], Validators.required),
      showFavorites: this.formBuilder.nonNullable.control(false),
      priceChangeTimeframe: this.formBuilder.nonNullable.control(TimeframeValue.Day)
    })
  });

  override get canSave(): boolean {
    return this.settingsForm.valid;
  }

  protected getUpdatedSettings(initialSetting: WatchlistsWidgetSettings): Partial<WatchlistsWidgetSettings> {
    const {instrumentColumns, ...displaySettings} = this.settingsForm.controls.display.getRawValue();

    return {
      ...displaySettings,
      instrumentTable: this.updateTableSettings(instrumentColumns, initialSetting.instrumentTable)
    };
  }

  protected setCurrentFormValues(settings: WatchlistsWidgetSettings): void {
    this.settingsForm.reset({
      display: {
        instrumentColumns: TableSettingHelper.toTableDisplaySettings(
          settings.instrumentTable,
          settings.instrumentColumns ?? []
        )?.columns.map(c => c.columnId) ?? [],
        showFavorites: settings.showFavorites ?? false,
        priceChangeTimeframe: settings.priceChangeTimeframe ?? TimeframeValue.Day
      }
    });
  }

  private updateTableSettings(columnIds: string[], currentSettings?: TableDisplaySettings): TableDisplaySettings {
    const newSettings = TableSettingHelper.toTableDisplaySettings(null, columnIds)!;

    if (currentSettings) {
      newSettings.columns.forEach((column, index) => {
        const matchedColumn = currentSettings!.columns.find(x => x.columnId === column.columnId);
        if (matchedColumn) {
          newSettings.columns[index] = {
            ...column,
            ...matchedColumn
          };
        }
      });
    }

    return newSettings!;
  }
}
