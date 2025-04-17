import {
  Component,
  Input,
  OnInit
} from '@angular/core';
import { WidgetInstance } from "../../../../shared/models/dashboard/dashboard-item.model";
import { Observable } from "rxjs";
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";
import { WidgetSettingsCreationHelper } from "../../../../shared/utils/widget-settings/widget-settings-creation-helper";
import { AdminClientsSettings } from "../../models/admin-clients-settings.model";
import { TranslocoDirective } from "@jsverse/transloco";
import { SharedModule } from "../../../../shared/shared.module";
import { AdminClientsComponent } from "../../components/admin-clients/admin-clients.component";

@Component({
  selector: 'ats-admin-clients-widget',
  standalone: true,
  imports: [
    TranslocoDirective,
    SharedModule,
    AdminClientsComponent
  ],
  templateUrl: './admin-clients-widget.component.html',
  styleUrl: './admin-clients-widget.component.less'
})
export class AdminClientsWidgetComponent implements OnInit {
  shouldShowSettings = false;

  @Input({required: true})
  widgetInstance!: WidgetInstance;

  @Input({required: true})
  isBlockWidget!: boolean;

  settings$!: Observable<AdminClientsSettings>;

  constructor(
    private readonly widgetSettingsService: WidgetSettingsService
  ) {
  }

  get guid(): string {
    return this.widgetInstance.instance.guid;
  }

  onSettingsChange(): void {
    this.shouldShowSettings = !this.shouldShowSettings;
  }

  ngOnInit(): void {
    WidgetSettingsCreationHelper.createWidgetSettingsIfMissing<AdminClientsSettings>(
      this.widgetInstance,
      'AdminClientsSettings',
      settings => ({...settings}),
      this.widgetSettingsService
    );

    this.settings$ = this.widgetSettingsService.getSettings<AdminClientsSettings>(this.guid);
  }
}
