import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Observable } from "rxjs";
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";
import { WidgetSettingsCreationHelper } from "../../../../shared/utils/widget-settings/widget-settings-creation-helper";
import { ArbitrageSpreadSettings } from "../../models/arbitrage-spread-settings.model";

@Component({
  selector: 'ats-arbitrage-spread-widget',
  templateUrl: './arbitrage-spread-widget.component.html',
  styleUrls: ['./arbitrage-spread-widget.component.less']
})
export class ArbitrageSpreadWidgetComponent implements OnInit {
  @Input() public guid!: string;
  @Input()
  isBlockWidget!: boolean;
  @Output() public shouldShowSettingsChange = new EventEmitter<boolean>();
  settings$!: Observable<ArbitrageSpreadSettings>;

  constructor(
    private readonly widgetSettingsService: WidgetSettingsService
  ) {
  }

  ngOnInit(): void {
    WidgetSettingsCreationHelper.createWidgetSettingsIfMissing<ArbitrageSpreadSettings>(
      this.guid,
      'ArbitrationExtensionSettings',
      settings => ({
        ...settings,
      }),
      this.widgetSettingsService
    );

    this.settings$ = this.widgetSettingsService.getSettings<ArbitrageSpreadSettings>(this.guid);
  }
}
