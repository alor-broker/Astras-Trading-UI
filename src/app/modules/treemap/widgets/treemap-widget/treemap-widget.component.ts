import { Component, Input, OnInit } from '@angular/core';
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";
import { WidgetSettingsCreationHelper } from "../../../../shared/utils/widget-settings/widget-settings-creation-helper";
import { TreemapSettings } from "../../models/treemap.model";

@Component({
  selector: 'ats-treemap-widget[guid]',
  templateUrl: './treemap-widget.component.html',
  styleUrls: ['./treemap-widget.component.less']
})
export class TreemapWidgetComponent implements OnInit {
  @Input() public guid!: string;
  @Input()
  isBlockWidget!: boolean;

  constructor(
    private readonly widgetSettingsService: WidgetSettingsService
  ) {
  }

  ngOnInit(): void {
    WidgetSettingsCreationHelper.createWidgetSettingsIfMissing<TreemapSettings>(
      this.guid,
      'TreemapSettings',
      settings => ({
        ...settings
      }),
      this.widgetSettingsService
    );
  }
}
