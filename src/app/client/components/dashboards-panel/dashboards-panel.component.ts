import {
  Component,
  DestroyRef,
  OnDestroy,
  OnInit,
} from '@angular/core';
import {
  BehaviorSubject,
  combineLatest,
  Observable,
  shareReplay,
  take,
  withLatestFrom
} from "rxjs";
import { NzSegmentedOption } from "ng-zorro-antd/segmented/types";
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
import {AsyncPipe, NgIf} from "@angular/common";
import {NzSegmentedComponent} from "ng-zorro-antd/segmented";
import {FormsModule} from "@angular/forms";
import {NzTooltipDirective} from "ng-zorro-antd/tooltip";
import {NzButtonComponent} from "ng-zorro-antd/button";
import {NzDropDownDirective, NzDropdownMenuComponent} from "ng-zorro-antd/dropdown";
import {NzTypographyComponent} from "ng-zorro-antd/typography";
import {NzIconDirective} from "ng-zorro-antd/icon";
import {SelectDashboardMenuComponent} from "../select-dashboard-menu/select-dashboard-menu.component";

type DashboardSegmentedOption = {
  value: string;
  hasSelection: boolean;
} & NzSegmentedOption;

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
    NgIf,
    NzTypographyComponent,
    NzIconDirective,
    NzDropdownMenuComponent,
    SelectDashboardMenuComponent
  ],
  standalone: true
})
export class DashboardsPanelComponent implements OnInit, OnDestroy {
  options$!: Observable<DashboardSegmentedOption[]>;
  selectedOptionIndex$ = new BehaviorSubject<number>(0);
  isDashboardSelectionMenuVisible$ = new BehaviorSubject(false);
  lastSelectedNonFavoriteDashboard$ = new BehaviorSubject<Dashboard | null>(null);
  dropdownTrigger$ = new BehaviorSubject<'click' | 'hover'>('hover');

  constructor(
    private readonly manageDashboardsService: ManageDashboardsService,
    private readonly translatorService: TranslatorService,
    private readonly destroyRef: DestroyRef
  ) {
  }

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
            .filter(d => d.isFavorite)
            .sort((a, b) => (a.favoritesOrder ?? 0) - (b.favoritesOrder ?? 0))
            .map(d => ({
              value: d.guid,
              label: d.title,
              useTemplate: true,
              hasSelection: d.isSelected ?? false
            }));

          options.push({
            value: 'all_dashboards',
            label: 'all dashboards',
            useTemplate: true,
            disabled: true,
            hasSelection: false
          });

          return options;
        }
      ),
      shareReplay(1)
    );

    this.initSelectedOptionIndexChange();

    allDashboards$
      .pipe(
        withLatestFrom(this.lastSelectedNonFavoriteDashboard$),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(([dashboards, lastSelection]) => {
        const selectedDashboard = dashboards.find((d: Dashboard) => d.isSelected);
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
    this.selectedOptionIndex$.complete();
    this.isDashboardSelectionMenuVisible$.complete();
    this.lastSelectedNonFavoriteDashboard$.complete();
    this.dropdownTrigger$.complete();
  }

  changeDashboardSelectionMenuVisibility(value: boolean): void {
    setTimeout(() => this.isDashboardSelectionMenuVisible$.next(value));
  }

  selectDashboard(guid: string): void {
    this.manageDashboardsService.selectDashboard(<string>guid);
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

  private initSelectedOptionIndexChange(): void {
    this.options$.pipe(
      filter(o => o.length > 0),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(options => {
      const selectedIndex = options.findIndex(o => o.hasSelection);

      if (selectedIndex >= 0) {
        this.selectedOptionIndex$.next(selectedIndex);
      } else {
        this.selectedOptionIndex$.next(options.length - 1);
      }
    });
  }
}
