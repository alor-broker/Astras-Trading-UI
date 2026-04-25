import { Component, input, OnInit, output, inject } from '@angular/core';
import { Observable } from "rxjs";
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";
import { WidgetSettingsCreationHelper } from "../../../../shared/utils/widget-settings/widget-settings-creation-helper";
import { ArbitrageRobotSettings } from "../../models/arbitrage-robot-settings.model";
import { WidgetInstance } from "../../../../shared/models/dashboard/dashboard-item.model";
import { WidgetSkeletonComponent } from '../../../../shared/components/widget-skeleton/widget-skeleton.component';
import { WidgetHeaderComponent } from '../../../../shared/components/widget-header/widget-header.component';
import { AsyncPipe } from '@angular/common';
import { ArbitrageRobotTableComponent } from '../../components/arbitrage-robot-table/arbitrage-robot-table.component';
import { ArbitrageRobotModalWidgetComponent } from '../arbitrage-robot-modal-widget/arbitrage-robot-modal-widget.component';
import { ArbitrageRobotService } from "../../services/arbitrage-robot.service";
import { RobotEngineService } from "../../services/robot-engine.service";

@Component({
  selector: 'ats-arbitrage-robot-widget',
  templateUrl: './arbitrage-robot-widget.component.html',
  imports: [
    WidgetSkeletonComponent,
    WidgetHeaderComponent,
    ArbitrageRobotTableComponent,
    ArbitrageRobotModalWidgetComponent,
    AsyncPipe
  ],
  providers: [ArbitrageRobotService, RobotEngineService]
})
export class ArbitrageRobotWidgetComponent implements OnInit {
  private readonly widgetSettingsService = inject(WidgetSettingsService);

  readonly widgetInstance = input.required<WidgetInstance>();
  readonly isBlockWidget = input.required<boolean>();
  readonly shouldShowSettingsChange = output<boolean>();

  settings$!: Observable<ArbitrageRobotSettings>;

  get guid(): string {
    return this.widgetInstance().instance.guid;
  }

  ngOnInit(): void {
    WidgetSettingsCreationHelper.createWidgetSettingsIfMissing<ArbitrageRobotSettings>(
      this.widgetInstance(),
      'ArbitrageRobotSettings',
      settings => ({ ...settings }),
      this.widgetSettingsService
    );

    this.settings$ = this.widgetSettingsService.getSettings<ArbitrageRobotSettings>(this.guid);
  }
}
