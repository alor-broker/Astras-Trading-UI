import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Observable } from "rxjs";
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";
import { WidgetSettingsCreationHelper } from "../../../../shared/utils/widget-settings/widget-settings-creation-helper";
import { ArbitrageSpreadSettings } from "../../models/arbitrage-spread-settings.model";
import {WidgetInstance} from "../../../../shared/models/dashboard/dashboard-item.model";

@Component({
  selector: 'ats-arbitrage-spread-widget[widgetInstance][isBlockWidget]',
  templateUrl: './arbitrage-spread-widget.component.html',
  styleUrls: ['./arbitrage-spread-widget.component.less']
})
export class ArbitrageSpreadWidgetComponent implements OnInit {
  @Input()
  widgetInstance!: WidgetInstance;
  @Input()
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
