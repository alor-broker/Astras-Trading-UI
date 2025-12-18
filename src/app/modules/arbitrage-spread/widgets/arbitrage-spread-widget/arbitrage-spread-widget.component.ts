import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {Observable} from "rxjs";
import {WidgetSettingsService} from "../../../../shared/services/widget-settings.service";
import {WidgetSettingsCreationHelper} from "../../../../shared/utils/widget-settings/widget-settings-creation-helper";
import {ArbitrageSpreadSettings} from "../../models/arbitrage-spread-settings.model";
import {WidgetInstance} from "../../../../shared/models/dashboard/dashboard-item.model";
import {TranslocoDirective} from '@jsverse/transloco';
import {WidgetSkeletonComponent} from '../../../../shared/components/widget-skeleton/widget-skeleton.component';
import {WidgetHeaderComponent} from '../../../../shared/components/widget-header/widget-header.component';
import {ArbitrageSpreadTableComponent} from '../../components/arbitrage-spread-table/arbitrage-spread-table.component';
import {
  ArbitrageSpreadModalWidgetComponent
} from '../arbitrage-spread-modal-widget/arbitrage-spread-modal-widget.component';
import {AsyncPipe} from '@angular/common';
import {ArbitrageSpreadService} from "../../services/arbitrage-spread.service";

@Component({
  selector: 'ats-arbitrage-spread-widget',
  templateUrl: './arbitrage-spread-widget.component.html',
  styleUrls: ['./arbitrage-spread-widget.component.less'],
  imports: [
    TranslocoDirective,
    WidgetSkeletonComponent,
    WidgetHeaderComponent,
    ArbitrageSpreadTableComponent,
    ArbitrageSpreadModalWidgetComponent,
    AsyncPipe
  ],
  providers: [ArbitrageSpreadService]
})
export class ArbitrageSpreadWidgetComponent implements OnInit {
  @Input({required: true})
  widgetInstance!: WidgetInstance;

  @Input({required: true})
  isBlockWidget!: boolean;

  @Output() public shouldShowSettingsChange = new EventEmitter<boolean>();
  settings$!: Observable<ArbitrageSpreadSettings>;

  constructor(
    private readonly widgetSettingsService: WidgetSettingsService
  ) {
  }

  get guid(): string {
    return this.widgetInstance.instance.guid;
  }

  ngOnInit(): void {
    WidgetSettingsCreationHelper.createWidgetSettingsIfMissing<ArbitrageSpreadSettings>(
      this.widgetInstance,
      'ArbitrationExtensionSettings',
      settings => ({
        ...settings,
      }),
      this.widgetSettingsService
    );

    this.settings$ = this.widgetSettingsService.getSettings<ArbitrageSpreadSettings>(this.guid);
  }
}
