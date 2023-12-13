import {Component, OnInit} from '@angular/core';
import {DashboardContextService} from "../../../../shared/services/dashboard-context.service";
import {combineLatest, distinctUntilChanged, Observable, shareReplay, take} from "rxjs";
import {map} from "rxjs/operators";
import {WidgetsHelper} from "../../../../shared/utils/widgets";
import {WidgetInstance} from "../../../../shared/models/dashboard/dashboard-item.model";
import {WidgetsMetaService} from "../../../../shared/services/widgets-meta.service";
import {TranslatorService} from "../../../../shared/services/translator.service";
import {WidgetMeta} from "../../../../shared/models/widget-meta.model";
import {arraysEqual} from "ng-zorro-antd/core/util";

@Component({
  selector: 'ats-mobile-dashboard',
  templateUrl: './mobile-dashboard.component.html',
  styleUrls: ['./mobile-dashboard.component.less']
})
export class MobileDashboardComponent implements OnInit {

  widgets$!: Observable<WidgetInstance[]>;

  constructor(
    private readonly dashboardContextService: DashboardContextService,
    private readonly widgetsMetaService: WidgetsMetaService,
    private readonly translatorService: TranslatorService
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
  }

  getWidgetName(meta: WidgetMeta): string {
    return WidgetsHelper.getWidgetName(meta.mobileMeta?.widgetName ?? meta.widgetName, this.translatorService.getActiveLang());
  }
}
