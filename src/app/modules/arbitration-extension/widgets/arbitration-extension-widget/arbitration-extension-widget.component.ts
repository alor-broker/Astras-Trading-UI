import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Observable } from "rxjs";
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";
import { WidgetSettingsCreationHelper } from "../../../../shared/utils/widget-settings/widget-settings-creation-helper";
import { ArbitrationExtensionSettings } from "../../models/arbitration-extension-settings.model";

@Component({
  selector: 'ats-arbitration-extension-widget',
  templateUrl: './arbitration-extension-widget.component.html',
  styleUrls: ['./arbitration-extension-widget.component.less']
})
export class ArbitrationExtensionWidgetComponent implements OnInit {
  @Input() public guid!: string;
  @Input()
  isBlockWidget!: boolean;
  @Output() public shouldShowSettingsChange = new EventEmitter<boolean>();
  settings$!: Observable<ArbitrationExtensionSettings>;

  constructor(
    private readonly widgetSettingsService: WidgetSettingsService
  ) {
  }

  ngOnInit(): void {
    WidgetSettingsCreationHelper.createWidgetSettingsIfMissing<ArbitrationExtensionSettings>(
      this.guid,
      'ArbitrationExtensionSettings',
      settings => ({
        ...settings,
      }),
      this.widgetSettingsService
    );

    this.settings$ = this.widgetSettingsService.getSettings<ArbitrationExtensionSettings>(this.guid);
  }
}
