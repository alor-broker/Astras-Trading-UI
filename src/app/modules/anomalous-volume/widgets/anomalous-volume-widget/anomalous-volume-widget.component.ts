import { Component, OnInit, inject, input } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { Observable } from 'rxjs';
import { WidgetInstance } from '../../../../shared/models/dashboard/dashboard-item.model';
import { WidgetSettingsService } from '../../../../shared/services/widget-settings.service';
import { WidgetSettingsCreationHelper } from '../../../../shared/utils/widget-settings/widget-settings-creation-helper';
import { getValueOrDefault } from '../../../../shared/utils/object-helper';
import { WidgetSkeletonComponent } from '../../../../shared/components/widget-skeleton/widget-skeleton.component';
import { WidgetHeaderComponent } from '../../../../shared/components/widget-header/widget-header.component';
import { AnomalousVolumeComponent } from '../../components/anomalous-volume/anomalous-volume.component';
import { AnomalousVolumeSettingsComponent } from '../../components/anomalous-volume-settings/anomalous-volume-settings.component';
import {
  AnomalousVolumeSettings,
  anomalousVolumeWidgetColumns
} from '../../models/anomalous-volume-settings.model';

@Component({
  selector: 'ats-anomalous-volume-widget',
  templateUrl: './anomalous-volume-widget.component.html',
  styleUrl: './anomalous-volume-widget.component.less',
  imports: [
    AsyncPipe,
    WidgetSkeletonComponent,
    WidgetHeaderComponent,
    AnomalousVolumeComponent,
    AnomalousVolumeSettingsComponent
  ]
})
export class AnomalousVolumeWidgetComponent implements OnInit {
  private readonly widgetSettingsService = inject(WidgetSettingsService);

  shouldShowSettings = false;

  readonly widgetInstance = input.required<WidgetInstance>();

  readonly isBlockWidget = input.required<boolean>();

  settings$!: Observable<AnomalousVolumeSettings>;

  get guid(): string {
    return this.widgetInstance().instance.guid;
  }

  ngOnInit(): void {
    WidgetSettingsCreationHelper.createWidgetSettingsIfMissing<AnomalousVolumeSettings>(
      this.widgetInstance(),
      'AnomalousVolumeSettings',
      settings => ({
        ...settings,
        instruments: getValueOrDefault(settings.instruments, []),
        timeframe: getValueOrDefault(settings.timeframe, '1m'),
        windowSize: getValueOrDefault(settings.windowSize, 30),
        sigmaMultiplier: getValueOrDefault(settings.sigmaMultiplier, 2.5),
        soundAlertEnabled: getValueOrDefault(settings.soundAlertEnabled, true),
        maxInstruments: getValueOrDefault(settings.maxInstruments, 50),
        anomalousVolumeColumns: getValueOrDefault(
          settings.anomalousVolumeColumns,
          anomalousVolumeWidgetColumns.map(c => c.id)
        )
      }),
      this.widgetSettingsService
    );

    this.settings$ = this.widgetSettingsService.getSettings<AnomalousVolumeSettings>(this.guid);
  }

  onSettingsChange(): void {
    this.shouldShowSettings = !this.shouldShowSettings;
  }
}

