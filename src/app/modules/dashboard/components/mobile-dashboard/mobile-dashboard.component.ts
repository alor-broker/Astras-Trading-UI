import {
  Component,
  DestroyRef,
  OnInit,
  ViewChild
} from '@angular/core';
import {DashboardContextService} from "../../../../shared/services/dashboard-context.service";
import {combineLatest, distinctUntilChanged, Observable, shareReplay, take} from "rxjs";
import {
  filter,
  map
} from "rxjs/operators";
import {WidgetsHelper} from "../../../../shared/utils/widgets";
import {WidgetInstance} from "../../../../shared/models/dashboard/dashboard-item.model";
import {WidgetsMetaService} from "../../../../shared/services/widgets-meta.service";
import {TranslatorService} from "../../../../shared/services/translator.service";
import {WidgetMeta} from "../../../../shared/models/widget-meta.model";
import {arraysEqual} from "ng-zorro-antd/core/util";
import { MobileActionsContextService } from "../../services/mobile-actions-context.service";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { NzTabSetComponent } from "ng-zorro-antd/tabs";

@Component({
  selector: 'ats-mobile-dashboard',
  templateUrl: './mobile-dashboard.component.html',
  styleUrls: ['./mobile-dashboard.component.less']
})
export class MobileDashboardComponent implements OnInit {
  readonly newOrderWidgetId = 'order-submit';

  @ViewChild(NzTabSetComponent)
  tabs: NzTabSetComponent | null = null;

  widgets$!: Observable<WidgetInstance[]>;

  constructor(
    private readonly dashboardContextService: DashboardContextService,
    private readonly widgetsMetaService: WidgetsMetaService,
    private readonly translatorService: TranslatorService,
    private readonly mobileActionsContextService: MobileActionsContextService,
    private readonly destroyRef: DestroyRef
  ) {
  }

  ngOnInit(): void {
    const widgets$ = this.dashboardContextService.selectedDashboard$.pipe(
      distinctUntilChanged((previous, current) => arraysEqual(previous.items.map(x => x.guid), current.items.map(x => x.guid)))
    );

    this.widgets$ = combineLatest([
      widgets$,
      this.widgetsMetaService.getWidgetsMeta().pipe(take(1))
    ]).pipe(
      map(([dashboard, meta]) => {
        return dashboard.items.map(x => ({
          instance: x,
          widgetMeta: meta.find(m => m.typeId === x.widgetType)
        } as WidgetInstance))
          .filter(x => (x.widgetMeta.mobileMeta?.enabled ?? false));
      }),
      shareReplay(1)
    );

    this.mobileActionsContextService.actionEvents$.pipe(
      filter(e => e.eventType === "instrumentSelected"),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(() => {
      this.widgets$.pipe(
        take(1)
      ).subscribe(widgets => {
        if(!this.tabs) {
          return;
        }

        const newOrderWidget = widgets.findIndex(w => w.instance.widgetType === this.newOrderWidgetId);
        if(newOrderWidget < 0) {
          return;
        }

        this.tabs.setSelectedIndex(newOrderWidget);
      });
    });
  }

  getWidgetName(meta: WidgetMeta): string {
    return WidgetsHelper.getWidgetName(meta.mobileMeta?.widgetName ?? meta.widgetName, this.translatorService.getActiveLang());
  }
}
