import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output
} from '@angular/core';
import {
  Observable,
  take
} from 'rxjs';
import {
  Dashboard,
  DefaultDashboardName
} from '../../../../shared/models/dashboard/dashboard.model';
import { ManageDashboardsService } from '../../../../shared/services/manage-dashboards.service';
import {
  FormControl,
  FormGroup,
  UntypedFormGroup,
  Validators
} from '@angular/forms';
import { NzModalService } from 'ng-zorro-antd/modal';
import { TranslatorService } from '../../../../shared/services/translator.service';
import { mapWith } from '../../../../shared/utils/observable-helper';
import { map } from 'rxjs/operators';

@Component({
  selector: 'ats-select-dashboard-menu',
  templateUrl: './select-dashboard-menu.component.html',
  styleUrls: ['./select-dashboard-menu.component.less']
})
export class SelectDashboardMenuComponent implements OnInit {
  readonly validationOptions = {
    title: {
      minLength: 1,
      maxLength: 50
    }
  };

  newDashboardForm?: UntypedFormGroup;

  allDashboards$!: Observable<Dashboard[]>;

  @Output()
  hideMenu = new EventEmitter();

  @Output()
  isNewDashboardFocused = new EventEmitter<boolean>();

  constructor(
    private readonly dashboardService: ManageDashboardsService,
    private readonly modal: NzModalService,
    private readonly translatorService: TranslatorService
  ) {
  }

  @Input()
  set visibilityChange(value: boolean) {
    this.newDashboardForm?.reset();
  }

  checkInputComplete(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      this.addDashboard();
    }
  }

  ngOnInit(): void {
    this.buildNewDashboardForm();
    this.allDashboards$ = this.translatorService.getTranslator('dashboard/select-dashboard-menu').pipe(
      mapWith(() => this.dashboardService.allDashboards$, (translator, allDashboards) => ({
        t: translator,
        allDashboards
      })),
      map(({ t, allDashboards }) => allDashboards.map(d => ({
        ...d,
        title: d.title.includes(DefaultDashboardName) ? d.title.replace(DefaultDashboardName, t(['defaultDashboardName']))  : d.title
      })))
    );
  }

  addDashboard(): void {
    if (this.newDashboardForm!.valid) {
      this.dashboardService.addDashboard(this.newDashboardForm!.value.title);
      this.hideMenu.emit();
      this.newDashboardForm!.reset();
    }
  }

  selectDashboard(guid: string): void {
    this.dashboardService.selectDashboard(guid);
    this.hideMenu.emit();
  }

  removeDashboard(dashboard: Dashboard): void {
    this.translatorService.getTranslator('dashboard/select-dashboard-menu').pipe(
      take(1)
    ).subscribe(t => {
      this.modal.confirm({
        nzTitle: t(['removeConfirmationTitle']),
        nzContent: t(['removeConfirmationMessage'], { title: dashboard.title }),
        nzOkText: t(['confirmButtonText']),
        nzOkType: 'primary',
        nzOkDanger: true,
        nzCancelText: t(['cancelButtonText']),
        nzOnOk: () => this.dashboardService.removeDashboard(dashboard.guid)
      });
    });
  }

  copyDashboard(dashboard: Dashboard): void {
    this.translatorService.getTranslator('dashboard/select-dashboard-menu').pipe(
      take(1)
    ).subscribe(t => {
      this.modal.confirm({
        nzTitle: t(['actionConfirmationTitle']),
        nzContent: t(['copyConfirmationMessage'], { title: dashboard.title }),
        nzOkText: t(['confirmButtonText']),
        nzOkType: 'primary',
        nzOkDanger: true,
        nzCancelText: t(['cancelButtonText']),
        nzOnOk: () => this.dashboardService.copyDashboard(dashboard.guid)
      });
    });
  }

  renameDashboard(guid: string, newTitle: string): void {
    this.dashboardService.renameDashboard(guid, newTitle);
  }

  changeFavoriteDashboard(dashboard: Dashboard): void {
    if (dashboard.isFavorite ?? false) {
      this.dashboardService.removeDashboardFromFavorites(dashboard.guid);
    } else {
      this.dashboardService.addDashboardToFavorites(dashboard.guid);
    }
  }

  private buildNewDashboardForm(): void {
    this.newDashboardForm = new FormGroup({
      title: new FormControl(
        '',
        [
          Validators.required,
          Validators.minLength(this.validationOptions.title.minLength),
          Validators.maxLength(this.validationOptions.title.maxLength),
        ]
      )
    });
  }
}
