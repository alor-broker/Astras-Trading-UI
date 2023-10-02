import {
  Component,
  DestroyRef,
  Input,
  OnDestroy,
  OnInit,
} from '@angular/core';
import {
  BehaviorSubject,
  Observable,
  shareReplay,
  take,
  tap,
  withLatestFrom
} from "rxjs";
import { Dashboard, DefaultDashboardName } from "../../../../shared/models/dashboard/dashboard.model";
import { NzSegmentedOption } from "ng-zorro-antd/segmented/types";
import { mapWith } from "../../../../shared/utils/observable-helper";
import { debounceTime, map } from "rxjs/operators";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { ManageDashboardsService } from "../../../../shared/services/manage-dashboards.service";
import { TranslatorService } from "../../../../shared/services/translator.service";
import { CdkDragDrop } from "@angular/cdk/drag-drop";

interface DashboardSegmentedOption extends NzSegmentedOption {
  value: string;
}

@Component({
  selector: 'ats-dashboards-panel',
  templateUrl: './dashboards-panel.component.html',
  styleUrls: ['./dashboards-panel.component.less']
})
export class DashboardsPanelComponent implements OnInit, OnDestroy {
  @Input({ required: true }) selectedDashboard!: Dashboard | null;
  favoriteDashboards$!: Observable<DashboardSegmentedOption[]>;
  selectedDashboardIndex$ = new BehaviorSubject<number>(0);
  isDashboardSelectionMenuVisible$ = new BehaviorSubject(false);
  lastSelectedDashboard$ = new BehaviorSubject<Dashboard | null>(null);
  dropdownTrigger$ = new BehaviorSubject<'click' | 'hover'>('hover');

  constructor(
    private readonly manageDashboardsService: ManageDashboardsService,
    private readonly translatorService: TranslatorService,
    private readonly destroyRef: DestroyRef
  ) {
  }

  ngOnInit() {
    const allDashboards$ = this.translatorService.getTranslator('dashboard/select-dashboard-menu').pipe(
      mapWith(
        () => this.manageDashboardsService.allDashboards$,
        (t, dashboards) => ({ t, dashboards })
      ),
      map(data => data.dashboards.map(d => ({
        ...d,
        title: d.title.includes(DefaultDashboardName) ? d.title.replace(DefaultDashboardName, data.t(['defaultDashboardName'])) : d.title
      }))),
      shareReplay(1)
    );

    this.favoriteDashboards$ = allDashboards$.pipe(
      tap(dashboards => {
        const favDashboardsLength = dashboards.filter(d => d.isFavorite).length;

        if (this.selectedDashboardIndex$.getValue() > favDashboardsLength) {
          this.selectedDashboardIndex$.next(favDashboardsLength);
        }
      }),
      debounceTime(50), // used to prevent animation error
      map((dashboards) => {
          const options: DashboardSegmentedOption[] = dashboards
            .filter(d => d.isFavorite)
            .sort((a, b) => (a.favoritesOrder ?? 0) - (b.favoritesOrder ?? 0))
            .map(d => ({
              value: d.guid,
              label: d.title,
              useTemplate: true
            }));
          options.push({ value: 'dashboardsDropdown', label: 'dashboards dropdown', useTemplate: true, disabled: true });

          return options;
        }
      ),
      shareReplay(1)
    );

    allDashboards$
      .pipe(
        withLatestFrom(this.lastSelectedDashboard$),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(([ dashboards, lastSelectedDashboard ]) => {
        const selectedDashboard: Dashboard = dashboards.find((d: Dashboard) => d.isSelected)!;
        const updatedLastSelectedDashboard: Dashboard | undefined = dashboards.find(d => d.guid === lastSelectedDashboard?.guid);

        if (!updatedLastSelectedDashboard || updatedLastSelectedDashboard.isFavorite) {
          this.lastSelectedDashboard$.next(dashboards.find(d => !d.isFavorite) ?? null);
        }

        if (selectedDashboard.guid !== updatedLastSelectedDashboard?.guid && !selectedDashboard.isFavorite) {
          this.lastSelectedDashboard$.next(selectedDashboard);
        }

      });

    this.favoriteDashboards$
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        map(fd => fd.findIndex((d, i) => i === fd.length - 1 ? true : d.value === this.selectedDashboard!.guid)),
      )
      .subscribe(i => this.selectedDashboardIndex$.next(i));
  }

  ngOnDestroy() {
    this.selectedDashboardIndex$.complete();
    this.isDashboardSelectionMenuVisible$.complete();
    this.lastSelectedDashboard$.complete();
    this.dropdownTrigger$.complete();
  }

  changeDashboardSelectionMenuVisibility(value: boolean) {
    setTimeout(() => this.isDashboardSelectionMenuVisible$.next(value));
  }

  selectDashboard(guid: string) {
    this.manageDashboardsService.selectDashboard(<string>guid);
  }

  changeDashboardsOrder(e: CdkDragDrop<any>) {
    this.favoriteDashboards$
      .pipe(
        take(1)
      )
      .subscribe(dashboards => {
        this.manageDashboardsService.changeFavoriteDashboardsOrder(dashboards[e.previousIndex]!.value, e.currentIndex);
      });
  }
}
