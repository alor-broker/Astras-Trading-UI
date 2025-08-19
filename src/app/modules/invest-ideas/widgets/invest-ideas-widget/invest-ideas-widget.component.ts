import {
  Component,
  Input,
  OnInit
} from '@angular/core';
import {
  AsyncPipe,
  NgIf
} from "@angular/common";
import { SharedModule } from "../../../../shared/shared.module";
import { WidgetInstance } from "../../../../shared/models/dashboard/dashboard-item.model";
import { Observable } from "rxjs";
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";
import { WidgetSettingsCreationHelper } from "../../../../shared/utils/widget-settings/widget-settings-creation-helper";
import { InvestIdeasSettings } from "../../models/invest-ideas-settings.model";

@Component({
  selector: 'ats-invest-ideas-widget',
  imports: [
    AsyncPipe,
    NgIf,
    SharedModule
  ],
  templateUrl: './invest-ideas-widget.component.html',
  styleUrl: './invest-ideas-widget.component.less'
})
export class InvestIdeasWidgetComponent implements OnInit {
  @Input({required: true})
  widgetInstance!: WidgetInstance;

  @Input({required: true})
  isBlockWidget!: boolean;

  settings$!: Observable<InvestIdeasSettings>;

  constructor(private readonly widgetSettingsService: WidgetSettingsService) {
  }

  get guid(): string {
    return this.widgetInstance.instance.guid;
  }

  ngOnInit(): void {
    WidgetSettingsCreationHelper.createWidgetSettingsIfMissing<InvestIdeasSettings>(
      this.widgetInstance,
      'InvestIdeasSettings',
      settings => ({
        ...settings,
      }),
      this.widgetSettingsService
    );

    this.settings$ = this.widgetSettingsService.getSettings<InvestIdeasSettings>(this.guid);
  }
}
