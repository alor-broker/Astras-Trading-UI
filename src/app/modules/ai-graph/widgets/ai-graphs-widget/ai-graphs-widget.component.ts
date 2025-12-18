import {Component, Input, OnInit} from '@angular/core';
import {WidgetInstance} from "../../../../shared/models/dashboard/dashboard-item.model";
import { AsyncPipe } from "@angular/common";
import {TranslocoDirective} from "@jsverse/transloco";
import {WidgetSettingsService} from "../../../../shared/services/widget-settings.service";
import {Observable} from "rxjs";
import {WidgetSettingsCreationHelper} from "../../../../shared/utils/widget-settings/widget-settings-creation-helper";
import {GraphsListComponent} from "../../components/graphs-list/graphs-list.component";
import {AiGraphsSettings} from "../../models/ai-graphs-settings.model";
import {AiGraphEditorDialogComponent} from "../ai-graph-editor-dialog/ai-graph-editor-dialog.component";
import {WidgetSkeletonComponent} from "../../../../shared/components/widget-skeleton/widget-skeleton.component";
import {WidgetHeaderComponent} from "../../../../shared/components/widget-header/widget-header.component";

@Component({
    selector: 'ats-ai-graphs-widget',
  imports: [
    AsyncPipe,
    TranslocoDirective,
    GraphsListComponent,
    AiGraphEditorDialogComponent,
    WidgetSkeletonComponent,
    WidgetHeaderComponent
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
