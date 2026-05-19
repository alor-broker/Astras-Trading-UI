import {
  ChangeDetectionStrategy,
  Component,
  forwardRef,
  inject,
  model,
  signal,
  ViewEncapsulation
} from '@angular/core';
import {NG_VALUE_ACCESSOR} from '@angular/forms';
import {ControlValueAccessorBase} from '../../../forms/components/control-value-accessor-base';
import {
  MobileDashboardLayout,
  QuickAccessPanelWidget
} from '../../terminal-settings.types';
import {DashboardTemplatesService} from '../../../dashboard/services/dashboard-templates.service';
import {MobileLayoutHelper} from '../../../dashboard/mobile/utils/mobile-layout.helper';
import {
  combineLatest,
  map,
  take
} from 'rxjs';
import {toObservable} from '@angular/core/rxjs-interop';
import {WidgetsMetaService} from '../../../widgets-gallery/services/widgets-meta.service';
import {DASHBOARD_CONTEXT_SERVICE} from '../../../dashboard/services/dashboard-context-service.types';
import {
  CdkDrag,
  CdkDragDrop,
  CdkDropList
} from '@angular/cdk/drag-drop';
import {TranslocoDirective} from '@jsverse/transloco';
import {AsyncPipe} from '@angular/common';
import {NzTypographyComponent} from 'ng-zorro-antd/typography';
import {QuickPanelItemForm} from '../quick-panel-item-form/quick-panel-item-form';

@Component({
  selector: 'ats-mobile-dashboard-layout-form',
  imports: [
    TranslocoDirective,
    AsyncPipe,
    NzTypographyComponent,
    CdkDropList,
    QuickPanelItemForm,
    CdkDrag
  ],
  templateUrl: './mobile-dashboard-layout-form.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      multi: true,
      useExisting: forwardRef(() => MobileDashboardLayoutForm),
    }
  ],
})
export class MobileDashboardLayoutForm extends ControlValueAccessorBase<MobileDashboardLayout> {
  protected readonly currentFormValue = signal<MobileDashboardLayout | null>(null);

  protected readonly currentQuickAccessPanelWidgets = model<(QuickAccessPanelWidget | null)[]>([]);

  private readonly dashboardTemplatesService = inject(DashboardTemplatesService);

  protected readonly defaultQuickAccessPanelWidgets$ = MobileLayoutHelper.getDefaultQuickAccessPanelWidgets(this.dashboardTemplatesService);

  protected readonly quickPanelSlots$ = combineLatest({
    defaultWidgets: this.defaultQuickAccessPanelWidgets$,
    currentWidgets: toObservable(this.currentQuickAccessPanelWidgets)
  }).pipe(
    map(x => {
      const currentSlots = x.currentWidgets ?? [];
      const totalSlotsCount = x.defaultWidgets.length;

      const displaySlots = currentSlots.map(i => ({...i} as QuickAccessPanelWidget | null));
      const itemsToAdd = totalSlotsCount - displaySlots.length;

      if (displaySlots.length < totalSlotsCount) {
        for (let i = 0; i < itemsToAdd; i++) {
          displaySlots.push(null);
        }
      }

      return displaySlots;
    })
  );

  private readonly dashboardContextService = inject(DASHBOARD_CONTEXT_SERVICE);

  private readonly widgetsMetaService = inject(WidgetsMetaService);

  protected readonly availableWidgets$ = combineLatest({
    currentDashboard: this.dashboardContextService.selectedDashboard$,
    widgetsMeta: this.widgetsMetaService.getWidgetsMeta(),
    quickPanelSlots: this.quickPanelSlots$
  }).pipe(
    map(x => {
      if (x.widgetsMeta == null) {
        return [];
      }

      const selectableWidgets = x.currentDashboard.items
        .filter(w => {
          const meta = x.widgetsMeta!.find(m => m.typeId === w.widgetType);
          return meta != null && (meta.mobileMeta?.selectableForQuickAccessPanel ?? false);
        })
        .map(w => w.widgetType);

      return selectableWidgets.filter(w => !(x.quickPanelSlots ?? []).some(s => s != null && s.widgetType === w));
    })
  );

  writeValue(value: MobileDashboardLayout | null): void {
    this.currentFormValue.set(value);
    if (value == null) {
      this.setDefaultsForQuickPanel();
    } else {
      this.currentQuickAccessPanelWidgets.set(value.quickAccessPanelWidgets);
    }
  }

  protected needMarkTouched(): boolean {
    return true;
  }

  protected changeOrder(event: CdkDragDrop<any>): void {
    const curr = this.currentQuickAccessPanelWidgets();
    const newSlots = [...curr];
    const item = newSlots.splice(event.previousIndex, 1)[0];
    newSlots.splice(event.currentIndex, 0, item);

    this.currentQuickAccessPanelWidgets.set(newSlots);

    this.emitUpdated();
  }

  protected changeItem(item: QuickAccessPanelWidget | null, index: number): void {
    const curr = this.currentQuickAccessPanelWidgets();
    const newSlots = [...curr];

    newSlots[index] = item;

    this.currentQuickAccessPanelWidgets.set(newSlots);

    this.emitUpdated();
  }

  private setDefaultsForQuickPanel(): void {
    this.defaultQuickAccessPanelWidgets$.pipe(
      take(1)
    ).subscribe(defaultWidgets => {
      this.currentQuickAccessPanelWidgets.set([...defaultWidgets]);

      this.checkIfTouched();
    });
  }

  private emitUpdated(): void {
    this.checkIfTouched();
    const currentValue = this.currentFormValue();
    const currentQuickAccessPanelWidgets = this.currentQuickAccessPanelWidgets();

    this.emitValue({
      ...currentValue,
      quickAccessPanelWidgets: [...currentQuickAccessPanelWidgets].filter(x => x != null)
    });
  }
}
