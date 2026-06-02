import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  OnDestroy,
  OnInit,
  signal,
  ViewEncapsulation
} from '@angular/core';
import {Dashboard} from "@terminal-core-lib/features/dashboard/types/dashboard.types";
import {DesktopManageDashboardsService} from '@terminal-core-lib/features/dashboard/desktop/services/desktop-manage-dashboards.service';
import {TranslatorService} from "@terminal-core-lib/features/translations/services/translator.service";
import {
  BehaviorSubject,
  combineLatest,
  debounceTime,
  filter,
  map,
  Observable,
  shareReplay,
  take,
  withLatestFrom
} from "rxjs";
import {DashboardTitleHelper} from '@terminal-core-lib/features/dashboard/utils/dashboard-title.helper';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {
  CdkDrag,
  CdkDragDrop,
  CdkDropList
} from '@angular/cdk/drag-drop';
import {AsyncPipe} from '@angular/common';
import {
  NzSegmentedComponent,
  NzSegmentedItemComponent
} from 'ng-zorro-antd/segmented';
import {FormsModule} from '@angular/forms';
import {NzTooltipDirective} from 'ng-zorro-antd/tooltip';
import {NzButtonComponent} from 'ng-zorro-antd/button';
import {
  NzDropdownDirective,
  NzDropdownMenuComponent
} from 'ng-zorro-antd/dropdown';
import {NzTypographyComponent} from 'ng-zorro-antd/typography';
import {NzIconDirective} from 'ng-zorro-antd/icon';
import {SelectDashboardMenu} from '../select-dashboard-menu/select-dashboard-menu';

interface DashboardSegmentedOption {
  value: string;
  label: string;
  hasSelection: boolean;
  disabled?: boolean;
}

@Component({
  selector: 'atsd-dashboards-panel',
  imports: [
    CdkDropList,
    AsyncPipe,
    NzSegmentedComponent,
    FormsModule,
    NzSegmentedItemComponent,
    NzTooltipDirective,
    CdkDrag,
    NzButtonComponent,
    NzDropdownDirective,
    NzTypographyComponent,
    NzIconDirective,
    NzDropdownMenuComponent,
    SelectDashboardMenu
  ],
  templateUrl: './dashboards-panel.html',
  styleUrl: './dashboards-panel.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class DashboardsPanel implements OnInit, OnDestroy {
  options$!: Observable<DashboardSegmentedOption[]>;

  selectedValue$!: Observable<string>;

  protected readonly isDashboardSelectionMenuVisible = signal(false);

  protected readonly lastSelectedNonFavoriteDashboard$ = new BehaviorSubject<Dashboard | null>(null);

  protected readonly dropdownTrigger = signal<'click' | 'hover'>(('hover'));

  private readonly desktopManageDashboardsService = inject(DesktopManageDashboardsService);

  private readonly translatorService = inject(TranslatorService);

  private readonly destroyRef = inject(DestroyRef);

  private readonly allDashboardsValue = 'all_dashboards';

  ngOnInit(): void {
    const allDashboards$ = combineLatest({
      translator: this.translatorService.getTranslator('dashboard/select-dashboard-menu'),
      dashboards: this.desktopManageDashboardsService.allDashboards$,
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
    this.lastSelectedNonFavoriteDashboard$.complete();
  }

  changeDashboardSelectionMenuVisibility(value: boolean): void {
    setTimeout(() => this.isDashboardSelectionMenuVisible.set(value));
  }

  selectDashboard(guid: string | number | null): void {
    if (guid != this.allDashboardsValue && guid != null) {
      this.desktopManageDashboardsService.selectDashboard(<string>guid);
    }
  }

  changeDashboardsOrder(e: CdkDragDrop<any>): void {
    this.options$
      .pipe(
        take(1)
      )
      .subscribe(dashboards => {
        this.desktopManageDashboardsService.changeFavoriteDashboardsOrder(dashboards[e.previousIndex]!.value, e.currentIndex);
      });
  }
}
