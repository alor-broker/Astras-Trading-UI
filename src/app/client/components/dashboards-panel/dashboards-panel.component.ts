import { ChangeDetectionStrategy, Component, DestroyRef, OnDestroy, OnInit, inject } from '@angular/core';
import {
  BehaviorSubject,
  combineLatest,
  Observable,
  shareReplay,
  take,
  withLatestFrom
} from "rxjs";
import {
  debounceTime,
  filter,
  map
} from "rxjs/operators";
import {Dashboard} from "../../../shared/models/dashboard/dashboard.model";
import {ManageDashboardsService} from "../../../shared/services/manage-dashboards.service";
import {TranslatorService} from "../../../shared/services/translator.service";
import {DashboardTitleHelper} from "../../../modules/dashboard/utils/dashboard-title.helper";
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";
import {CdkDrag, CdkDragDrop, CdkDropList} from "@angular/cdk/drag-drop";
import { AsyncPipe } from "@angular/common";
import {
  NzSegmentedComponent,
  NzSegmentedItemComponent
} from "ng-zorro-antd/segmented";
import {FormsModule} from "@angular/forms";
import {NzTooltipDirective} from "ng-zorro-antd/tooltip";
import {NzButtonComponent} from "ng-zorro-antd/button";
import {NzDropDownDirective, NzDropdownMenuComponent} from "ng-zorro-antd/dropdown";
import {NzTypographyComponent} from "ng-zorro-antd/typography";
import {NzIconDirective} from "ng-zorro-antd/icon";
import {SelectDashboardMenuComponent} from "../select-dashboard-menu/select-dashboard-menu.component";

interface DashboardSegmentedOption {
  value: string;
  label: string;
  hasSelection: boolean;
  disabled?: boolean;
}

@Component({
    selector: 'ats-dashboards-panel',
    templateUrl: './dashboards-panel.component.html',
    styleUrls: ['./dashboards-panel.component.less'],
  imports: [
    CdkDropList,
    AsyncPipe,
    NzSegmentedComponent,
    FormsModule,
    NzTooltipDirective,
    CdkDrag,
    NzButtonComponent,
    NzDropDownDirective,
    NzTypographyComponent,
    NzIconDirective,
    NzDropdownMenuComponent,
    SelectDashboardMenuComponent,
    NzSegmentedItemComponent
],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardsPanelComponent implements OnInit, OnDestroy {
  private readonly manageDashboardsService = inject(ManageDashboardsService);
  private readonly translatorService = inject(TranslatorService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly allDashboardsValue = 'all_dashboards';
  options$!: Observable<DashboardSegmentedOption[]>;
  isDashboardSelectionMenuVisible$ = new BehaviorSubject(false);
  lastSelectedNonFavoriteDashboard$ = new BehaviorSubject<Dashboard | null>(null);
  dropdownTrigger$ = new BehaviorSubject<'click' | 'hover'>('hover');
  selectedValue$!: Observable<string>;

  ngOnInit(): void {
    const allDashboards$ = combineLatest({
      translator: this.translatorService.getTranslator('dashboard/select-dashboard-menu'),
      dashboards: this.manageDashboardsService.allDashboards$,
    }).pipe(
      map(x => x.dashboards.map(d => ({
        ...d,
        title: DashboardTitleHelper.getDisplayTitle(d, x.translator)
      }))),
      shareReplay(1)
    );

    this.options$ = allDashboards$.pipe(
      debounceTime(50), // used to prevent animation error
      map((dashboards) => {
          const options: DashboardSegmentedOption[] = dashboards
            .filter(d => d.isFavorite ?? false)
            .sort((a, b) => (a.favoritesOrder ?? 0) - (b.favoritesOrder ?? 0))
            .map(d => ({
              value: d.guid,
              label: d.title,
              hasSelection: d.isSelected ?? false
            }));

          options.push({
            value: this.allDashboardsValue,
            label: 'all dashboards',
            disabled: true,
            hasSelection: false
          });

          return options;
        }
      ),
      shareReplay(1)
    );

    this.selectedValue$ = this.options$.pipe(
      filter(o => o.length > 0),
      map(o => {
        const selected = o.find(o => o.hasSelection);

        if (selected != null) {
          return selected.value;
        } else {
          return this.allDashboardsValue;
        }
      })
    );

    allDashboards$
      .pipe(
        withLatestFrom(this.lastSelectedNonFavoriteDashboard$),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(([dashboards, lastSelection]) => {
        const selectedDashboard = dashboards.find((d: Dashboard) => d.isSelected ?? false);
        const isFavorite = (dashboard: Dashboard): boolean => {
          return dashboard.isFavorite ?? false;
        };

        if (selectedDashboard != null && !isFavorite(selectedDashboard)) {
          this.lastSelectedNonFavoriteDashboard$.next(selectedDashboard);
        } else {
          if (lastSelection != null) {
            const lastSelectedDashboard = dashboards.find(d => d.guid === lastSelection.guid);
            if (lastSelectedDashboard != null && !isFavorite(lastSelectedDashboard)) {
              // need to update selection. For example, dashboard can be renamed
              this.lastSelectedNonFavoriteDashboard$.next(lastSelectedDashboard);
              return;
            }
          }

          const firstNonFavorite = dashboards.find(d => !isFavorite(d)) ?? null;
          this.lastSelectedNonFavoriteDashboard$.next(firstNonFavorite);
        }
      });
  }

  ngOnDestroy(): void {
    this.isDashboardSelectionMenuVisible$.complete();
    this.lastSelectedNonFavoriteDashboard$.complete();
    this.dropdownTrigger$.complete();
  }

  changeDashboardSelectionMenuVisibility(value: boolean): void {
    setTimeout(() => this.isDashboardSelectionMenuVisible$.next(value));
  }

  selectDashboard(guid: string | number | null): void {
    if(guid != this.allDashboardsValue && guid != null) {
      this.manageDashboardsService.selectDashboard(<string>guid);
    }
  }

  changeDashboardsOrder(e: CdkDragDrop<any>): void {
    this.options$
      .pipe(
        take(1)
      )
      .subscribe(dashboards => {
        this.manageDashboardsService.changeFavoriteDashboardsOrder(dashboards[e.previousIndex]!.value, e.currentIndex);
      });
  }
}
