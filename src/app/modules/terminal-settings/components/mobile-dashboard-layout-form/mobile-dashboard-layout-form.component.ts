import {
  Component,
  inject,
  model
} from '@angular/core';
import { ControlValueAccessorBaseComponent } from "../../../../shared/components/control-value-accessor-base/control-value-accessor-base.component";
import {
  MobileDashboardLayout,
  QuickAccessPanelWidget
} from "../../../../shared/models/terminal-settings/terminal-settings.model";
import { ManageDashboardsService } from "../../../../shared/services/manage-dashboards.service";
import { toObservable } from "@angular/core/rxjs-interop";
import { MobileLayoutHelper } from "../../../../shared/utils/mobile-layout.helper";
import { QuickPanelItemFormComponent } from "../quick-panel-item-form/quick-panel-item-form.component";
import {
  CdkDrag,
  CdkDragDrop,
  CdkDropList
} from "@angular/cdk/drag-drop";
import { NG_VALUE_ACCESSOR } from "@angular/forms";
import {
  combineLatest,
  take
} from "rxjs";
import { map } from "rxjs/operators";
import { AsyncPipe } from "@angular/common";
import { DashboardContextService } from "../../../../shared/services/dashboard-context.service";
import { WidgetsMetaService } from "../../../../shared/services/widgets-meta.service";
import { TranslocoDirective } from "@jsverse/transloco";
import { NzTypographyComponent } from "ng-zorro-antd/typography";

@Component({
  selector: 'ats-mobile-dashboard-layout-form',
  imports: [
    QuickPanelItemFormComponent,
    CdkDropList,
    CdkDrag,
    AsyncPipe,
    TranslocoDirective,
    NzTypographyComponent
  ],
  templateUrl: './mobile-dashboard-layout-form.component.html',
  styleUrl: './mobile-dashboard-layout-form.component.less',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      multi: true,
      useExisting: MobileDashboardLayoutFormComponent
    }
  ],
})
export class MobileDashboardLayoutFormComponent extends ControlValueAccessorBaseComponent<MobileDashboardLayout> {
  protected readonly currentFormValue = model<MobileDashboardLayout | null>(null);

  protected readonly currentQuickAccessPanelWidgets = model<(QuickAccessPanelWidget | null)[]>([]);

  private readonly manageDashboardsService = inject(ManageDashboardsService);

  protected readonly defaultQuickAccessPanelWidgets$ = MobileLayoutHelper.getDefaultQuickAccessPanelWidgets(this.manageDashboardsService);

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

  private readonly dashboardContextService = inject(DashboardContextService);

  private readonly widgetsMetaService = inject(WidgetsMetaService);

  protected readonly availableWidgets$ = combineLatest({
    currentDashboard: this.dashboardContextService.selectedDashboard$,
    widgetsMeta: this.widgetsMetaService.getWidgetsMeta(),
    quickPanelSlots: this.quickPanelSlots$
  }).pipe(
    map(x => {
      const selectableWidgets = x.currentDashboard.items
        .filter(w => {
          const meta = x.widgetsMeta.find(m => m.typeId === w.widgetType);
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
