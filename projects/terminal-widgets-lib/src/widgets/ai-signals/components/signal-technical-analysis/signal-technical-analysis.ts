import {formatNumber} from '@angular/common';
import {ChangeDetectionStrategy, Component, computed, inject, input, LOCALE_ID, signal, ViewEncapsulation} from '@angular/core';
import {toSignal} from '@angular/core/rxjs-interop';
import {TranslocoDirective} from '@jsverse/transloco';
import {NzButtonModule} from 'ng-zorro-antd/button';
import {NzTableModule} from 'ng-zorro-antd/table';
import {NzTabsModule} from 'ng-zorro-antd/tabs';
import {NzTagComponent} from 'ng-zorro-antd/tag';
import {NzTooltipModule} from 'ng-zorro-antd/tooltip';
import {TranslatorService} from '@terminal-core-lib/features/translations/services/translator.service';
import {TechnicalAnalysisFieldKeys, TechnicalAnalysisStatusKeys} from '../../types/technical-analysis-labels';
import {TechnicalMetric, TechnicalValueKind} from '../../types/technical-analysis-view.types';
import {TechnicalAnalysisViewModelHelper} from '../../utils/technical-analysis-view-model.helper';
import {TechnicalIndicatorGauge} from '../technical-indicator-gauge/technical-indicator-gauge';
import {TechnicalPriceLevels} from '../technical-price-levels/technical-price-levels';
import {SignalSection} from '../signal-section/signal-section';

@Component({
  selector: 'ats-signal-technical-analysis',
  imports: [
    SignalSection,
    TranslocoDirective, NzButtonModule, NzTableModule, NzTabsModule, NzTagComponent,
    NzTooltipModule, TechnicalIndicatorGauge, TechnicalPriceLevels
  ],
  templateUrl: './signal-technical-analysis.html',
  styleUrl: './signal-technical-analysis.less',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[style.display]': 'timeframes().length === 0 ? "none" : null'
  }
})
export class SignalTechnicalAnalysis {
  readonly analysis = input.required<Record<string, unknown> | null>();

  private readonly locale = inject(LOCALE_ID);

  private readonly translator = toSignal(inject(TranslatorService).getTranslator('ai-signals/technical-analysis'));

  protected readonly selectedKey = signal<string | null>(null);

  protected readonly showInactivePatterns = signal(false);

  protected readonly timeframes = computed(() => TechnicalAnalysisViewModelHelper.toTimeframes(this.analysis()));

  protected readonly selected = computed(() => {
    const timeframes = this.timeframes();
    return timeframes.find(timeframe => timeframe.key === this.selectedKey()) ?? timeframes[0] ?? null;
  });

  protected readonly tableGroups = computed(() => this.selected()?.groups.map(group => ({
    ...group,
    label: this.label(group.key),
    metrics: group.metrics.map(metric => ({
      ...metric,
      label: [...metric.context, metric.key].map(key => this.label(key)).join(' · '),
      displayValue: this.metricValue(metric)
    }))
  })) ?? []);

  protected readonly summary = computed(() => this.selected()?.summary.map(metric => ({
    ...metric, label: this.label(metric.key), displayValue: this.metricValue(metric)
  })) ?? []);

  protected readonly patternGroups = computed(() => this.selected()?.patterns.map(group => ({
    key: group.key,
    label: this.label(group.key),
    metrics: group.metrics.filter(metric => this.showInactivePatterns() || metric.value === true).map(metric => ({
      ...metric, label: this.label(metric.key)
    }))
  })).filter(group => group.metrics.length > 0) ?? []);

  protected label(key: string): string {
    if (/^\d+$/.test(key)) {
      return String(Number(key) + 1);
    }

    return TechnicalAnalysisFieldKeys.has(key) ? this.translator()?.(['fields', key]) ?? key : key.replaceAll('_', ' ');
  }

  protected number(value: number): string {
    return formatNumber(value, this.locale, '1.0-4');
  }

  protected percent(value: number): string {
    return `${value > 0 ? '+' : ''}${formatNumber(value, this.locale, '1.0-2')}%`;
  }

  private metricValue(metric: TechnicalMetric): string {
    if (metric.value == null) {
      return '—';
    }

    if (typeof metric.value === 'number') {
      const value = formatNumber(metric.value, this.locale, '1.0-6');
      return metric.kind === TechnicalValueKind.Percent
? `${value}%`
        : metric.kind === TechnicalValueKind.Ratio ? `${value}×` : value;
    }

    if (typeof metric.value === 'boolean') {
      return this.translator()?.([metric.value ? 'detected' : 'notDetected']) ?? '—';
    }

    if (TechnicalAnalysisStatusKeys.has(metric.value)) {
      return this.translator()?.(['statuses', metric.value]) ?? metric.value;
    }

    const signalParts = metric.value.split(':').map(part => part.trim());
    if (signalParts.length === 2 && TechnicalAnalysisFieldKeys.has(signalParts[1])) {
      return `${this.label(signalParts[0])}: ${this.label(signalParts[1])}`;
    }

    return metric.value;
  }
}
