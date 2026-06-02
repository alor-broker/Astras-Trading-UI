import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  ViewEncapsulation
} from '@angular/core';
import {DesktopManageDashboardsService} from '@terminal-core-lib/features/dashboard/desktop/services/desktop-manage-dashboards.service';
import {TranslatorService} from '@terminal-core-lib/features/translations/services/translator.service';
import {
  combineLatest,
  distinctUntilChanged,
  filter,
  map,
  Observable,
  shareReplay,
  take
} from 'rxjs';
import {AdminDashboardType} from '@terminal-core-lib/features/dashboard/types/dashboard.types';
import {DashboardTitleHelper} from '@terminal-core-lib/features/dashboard/utils/dashboard-title.helper';
import {LetDirective} from '@ngrx/component';
import {
  NzRadioComponent,
  NzRadioGroupComponent
} from 'ng-zorro-antd/radio';
import {FormsModule} from '@angular/forms';
import {NzIconDirective} from 'ng-zorro-antd/icon';

interface DashboardDisplay {
  label: string;
  value: string;
  closable: boolean;
  isSelected: boolean;
}

interface AdminDashboardsPanelViewModel {
  options: DashboardDisplay[];
  selectedValue: string | null;
}

@Component({
  selector: 'atsa-admin-dashboards-panel',
  imports: [
    LetDirective,
    NzRadioGroupComponent,
    FormsModule,
    NzRadioComponent,
    NzIconDirective
  ],
  templateUrl: './admin-dashboards-panel.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminDashboardsPanel implements OnInit {
  protected viewModel$!: Observable<AdminDashboardsPanelViewModel>;

  private readonly manageDashboardsService = inject(DesktopManageDashboardsService);

  private readonly translatorService = inject(TranslatorService);

  private readonly allDashboards$ = this.manageDashboardsService.allDashboards$.pipe(
    shareReplay({bufferSize: 1, refCount: true})
  );

  ngOnInit(): void {
    const dashboards$ = this.allDashboards$.pipe(
      distinctUntilChanged((previous, current) => JSON.stringify(previous) === JSON.stringify(current))
    );

    this.viewModel$ = combineLatest({
      translator: this.translatorService.getTranslator('dashboard/select-dashboard-menu'),
      dashboards: dashboards$,
    }).pipe(
      map(x => {
        const items: DashboardDisplay[] = [];

        const mainDashboard = x.dashboards.find(d => d.type === AdminDashboardType.AdminMain);
        if (mainDashboard == null) {
          return null;
        }

        items.push({
          label: DashboardTitleHelper.getDisplayTitle(mainDashboard, x.translator),
          value: mainDashboard.guid,
          closable: false,
          isSelected: mainDashboard.isSelected ?? false
        });

        x.dashboards.filter(d => d.type === AdminDashboardType.AdminSelectedPortfolio)
          .forEach(d => {
            items.push({
              label: d.title,
              value: d.guid,
              closable: true,
              isSelected: d.isSelected ?? false
            });
          });

        return {
          options: items,
          selectedValue: items.find(i => i.isSelected)?.value ?? null
        };
      }),
      filter((x): x is AdminDashboardsPanelViewModel => x != null),
      shareReplay(1)
    );
  }

  protected selectDashboard(guid: string): void {
    this.manageDashboardsService.selectDashboard(guid);
  }

  protected closeDashboard(guid: string): void {
    this.manageDashboardsService.removeDashboard(guid);

    this.allDashboards$.pipe(
      take(1),
    ).subscribe(all => {
      if (!all.some(d => d.isSelected ?? false)) {
        const main = all.find(d => d.type === AdminDashboardType.AdminMain);
        if (main != null) {
          this.manageDashboardsService.selectDashboard(main.guid);
        }
      }
    });
  }
}
