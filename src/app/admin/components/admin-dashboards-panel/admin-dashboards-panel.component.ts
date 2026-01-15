import { Component, OnInit, inject } from '@angular/core';
import { ManageDashboardsService } from "../../../shared/services/manage-dashboards.service";
import { TranslatorService } from "../../../shared/services/translator.service";
import {
  combineLatest,
  distinctUntilChanged,
  Observable,
  shareReplay,
  take
} from "rxjs";
import {
  filter,
  map
} from "rxjs/operators";
import { AdminDashboardType } from "../../../shared/models/dashboard/dashboard.model";
import { DashboardTitleHelper } from "../../../modules/dashboard/utils/dashboard-title.helper";
import { LetDirective } from "@ngrx/component";
import { NzIconDirective } from "ng-zorro-antd/icon";
import { FormsModule } from "@angular/forms";
import {
  NzRadioComponent,
  NzRadioGroupComponent
} from "ng-zorro-antd/radio";

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
  selector: 'ats-admin-dashboards-panel',
  standalone: true,
  imports: [
    LetDirective,
    NzIconDirective,
    FormsModule,
    NzRadioGroupComponent,
    NzRadioComponent
  ],
  templateUrl: './admin-dashboards-panel.component.html',
  styleUrl: './admin-dashboards-panel.component.less'
})
export class AdminDashboardsPanelComponent implements OnInit {
  private readonly manageDashboardsService = inject(ManageDashboardsService);
  private readonly translatorService = inject(TranslatorService);

  protected viewModel$!: Observable<AdminDashboardsPanelViewModel>;

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
      if(!all.some(d => d.isSelected ?? false)) {
        const main = all.find(d => d.type === AdminDashboardType.AdminMain);
        if (main != null) {
          this.manageDashboardsService.selectDashboard(main.guid);
        }
      }
    });
  }
}
