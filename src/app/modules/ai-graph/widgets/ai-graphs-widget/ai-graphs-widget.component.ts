import {Component, Input, OnInit} from '@angular/core';
import {WidgetInstance} from "../../../../shared/models/dashboard/dashboard-item.model";
import {AsyncPipe, NgIf} from "@angular/common";
import {SharedModule} from "../../../../shared/shared.module";
import {TranslocoDirective} from "@jsverse/transloco";
import {WidgetSettingsService} from "../../../../shared/services/widget-settings.service";
import {Observable} from "rxjs";
import {WidgetSettingsCreationHelper} from "../../../../shared/utils/widget-settings/widget-settings-creation-helper";
import {GraphsListComponent} from "../../components/graphs-list/graphs-list.component";
import {AiGraphsSettings} from "../../models/ai-graphs-settings.model";
import {AiGraphEditorDialogComponent} from "../ai-graph-editor-dialog/ai-graph-editor-dialog.component";

@Component({
  selector: 'ats-ai-graphs-widget',
  standalone: true,
  imports: [
    AsyncPipe,
    NgIf,
    SharedModule,
    TranslocoDirective,
    GraphsListComponent,
    AiGraphEditorDialogComponent
  ],
  templateUrl: './ai-graphs-widget.component.html',
  styleUrl: './ai-graphs-widget.component.less'
})
export class AiGraphsWidgetComponent implements OnInit {
  @Input({required: true})
  widgetInstance!: WidgetInstance;

  @Input({required: true})
  isBlockWidget!: boolean;

  settings$!: Observable<AiGraphsSettings>;

  constructor(private readonly widgetSettingsService: WidgetSettingsService) {
  }

  get guid(): string {
    return this.widgetInstance.instance.guid;
  }

  ngOnInit(): void {
    WidgetSettingsCreationHelper.createWidgetSettingsIfMissing<AiGraphsSettings>(
      this.widgetInstance,
      'AiGraphsSettings',
      settings => ({
        ...settings
      }),
      this.widgetSettingsService
    );

    this.settings$ = this.widgetSettingsService.getSettings<AiGraphsSettings>(this.guid);
  }
}
