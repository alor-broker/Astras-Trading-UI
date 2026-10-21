import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  output,
  ViewEncapsulation
} from '@angular/core';
import {toSignal} from '@angular/core/rxjs-interop';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators
} from "@angular/forms";
import {DesktopManageDashboardsService} from "@terminal-core-lib/features/dashboard/desktop/services/desktop-manage-dashboards.service";
import {NzModalService} from "ng-zorro-antd/modal";
import {TranslatorService} from '@terminal-core-lib/features/translations/services/translator.service';
import {take} from "rxjs";
import {Dashboard} from '@terminal-core-lib/features/dashboard/types/dashboard.types';
import {mapWith} from '@terminal-core-lib/common/utils/observable/map-with';
import {DashboardTitleHelper} from '@terminal-core-lib/features/dashboard/utils/dashboard-title.helper';
import {TranslocoDirective} from '@jsverse/transloco';
import {
  NzMenuDirective,
  NzMenuDividerDirective,
  NzMenuItemComponent
} from 'ng-zorro-antd/menu';
import {NzButtonComponent} from 'ng-zorro-antd/button';
import {NzIconDirective} from 'ng-zorro-antd/icon';
import {NzFormModule} from 'ng-zorro-antd/form';
import {
  NzInputDirective,
  NzInputWrapperComponent
} from 'ng-zorro-antd/input';
import {NzEmptyComponent} from 'ng-zorro-antd/empty';
import {EditableString} from '@terminal-core-lib/common/components/editable-string/editable-string';

@Component({
  selector: 'atsd-select-dashboard-menu',
  imports: [
    TranslocoDirective,
    NzMenuDirective,
    NzButtonComponent,
    NzIconDirective,
    NzMenuDividerDirective,
    NzFormModule,
    ReactiveFormsModule,
    NzInputDirective,
    NzInputWrapperComponent,
    NzEmptyComponent,
    EditableString,
    NzMenuItemComponent
  ],
  templateUrl: './select-dashboard-menu.html',
  styleUrl: './select-dashboard-menu.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class SelectDashboardMenu {
  readonly validationOptions = {
    title: {
      minLength: 1,
      maxLength: 50
    }
  };

  readonly hideMenu = output();

  readonly isInputFocused = output<boolean>();

  readonly visibilityChange = input<boolean>();

  private readonly formBuilder = inject(FormBuilder);

  readonly searchControl = this.formBuilder.nonNullable.control('');

  private readonly searchQuery = toSignal(this.searchControl.valueChanges, {initialValue: ''});

  newDashboardForm = this.formBuilder.group({
    title: this.formBuilder.nonNullable.control(
      '',
      [
        Validators.required,
        Validators.minLength(this.validationOptions.title.minLength),
        Validators.maxLength(this.validationOptions.title.maxLength),
      ]
    )
  });

  private readonly desktopManageDashboardsService = inject(DesktopManageDashboardsService);

  private readonly modal = inject(NzModalService);

  private readonly translatorService = inject(TranslatorService);

  readonly allDashboards = toSignal(
    this.translatorService.getTranslator('dashboard/select-dashboard-menu').pipe(
      mapWith(
        () => this.desktopManageDashboardsService.allDashboards$,
        (translator, allDashboards) => allDashboards.map(dashboard => ({
          ...dashboard,
          title: DashboardTitleHelper.getDisplayTitle(dashboard, translator)
        }))
      )
    ),
    {initialValue: []}
  );

  readonly isSearchVisible = computed(() => this.allDashboards().length > 10);

  readonly filteredDashboards = computed(() => {
    const dashboards = this.allDashboards();
    const query = this.isSearchVisible() ? this.searchQuery().trim().toLowerCase() : '';
    return query.length === 0
      ? dashboards
      : dashboards.filter(dashboard => dashboard.title.toLowerCase().includes(query));
  });

  constructor() {
    effect(() => {
      this.visibilityChange();
      this.newDashboardForm.reset();
      this.searchControl.reset();
    });
  }

  checkInputComplete(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      this.addDashboard();
    }
  }

  addDashboard(): void {
    if (this.newDashboardForm.valid) {
      this.desktopManageDashboardsService.addDashboard(this.newDashboardForm.value.title!);
      this.hideMenu.emit();
      this.newDashboardForm.reset();
    }
  }

  selectDashboard(guid: string): void {
    this.desktopManageDashboardsService.selectDashboard(guid);
    this.hideMenu.emit();
  }

  removeDashboard(dashboard: Dashboard): void {
    this.translatorService.getTranslator('dashboard/select-dashboard-menu').pipe(
      take(1)
    ).subscribe(t => {
      this.modal.confirm({
        nzTitle: t(['removeConfirmationTitle']),
        nzContent: t(['removeConfirmationMessage'], {title: dashboard.title}),
        nzOkText: t(['confirmButtonText']),
        nzOkType: 'primary',
        nzOkDanger: true,
        nzCancelText: t(['cancelButtonText']),
        nzOnOk: () => this.desktopManageDashboardsService.removeDashboard(dashboard.guid)
      });
    });
  }

  copyDashboard(dashboard: Dashboard): void {
    this.translatorService.getTranslator('dashboard/select-dashboard-menu').pipe(
      take(1)
    ).subscribe(t => {
      this.modal.confirm({
        nzTitle: t(['actionConfirmationTitle']),
        nzContent: t(['copyConfirmationMessage'], {title: dashboard.title}),
        nzOkText: t(['confirmButtonText']),
        nzOkType: 'primary',
        nzOkDanger: true,
        nzCancelText: t(['cancelButtonText']),
        nzOnOk: () => this.desktopManageDashboardsService.copyDashboard(dashboard.guid)
      });
    });
  }

  renameDashboard(guid: string, newTitle: string): void {
    this.desktopManageDashboardsService.renameDashboard(guid, newTitle);
  }

  changeFavoriteDashboard(dashboard: Dashboard): void {
    if (dashboard.isFavorite ?? false) {
      this.desktopManageDashboardsService.removeDashboardFromFavorites(dashboard.guid);
    } else {
      this.desktopManageDashboardsService.addDashboardToFavorites(dashboard.guid);
    }
  }

  toggleDashboardLock(dashboard: Dashboard): void {
    this.desktopManageDashboardsService.setDashboardLock(dashboard.guid, !(dashboard.isLocked ?? false));
  }
}
