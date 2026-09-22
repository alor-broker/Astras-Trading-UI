import {afterNextRender, ChangeDetectionStrategy, Component, computed, DestroyRef, effect, ElementRef, inject, Injector, input, model, OnInit, output, signal, untracked, viewChild, ViewEncapsulation} from '@angular/core';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {TranslocoDirective} from '@jsverse/transloco';
import {NzDrawerModule} from 'ng-zorro-antd/drawer';
import {WidgetsGalleryList} from '../widgets-gallery-list/widgets-gallery-list';
import {WidgetsGallerySubmenu} from '../widgets-gallery-submenu/widgets-gallery-submenu';
import {NzButtonModule} from 'ng-zorro-antd/button';
import {NzIconModule} from 'ng-zorro-antd/icon';
import {NzAlertModule} from 'ng-zorro-antd/alert';
import {NzSpinModule} from 'ng-zorro-antd/spin';
import {EntityStatus} from '../../../../common/types/entity-status.types';
import {DashboardType} from '../../../dashboard/types/dashboard.types';
import {WidgetMeta} from '../../services/widgets-meta-service.types';
import {WidgetsGallerySettingsService} from '../../services/widgets-gallery-settings.service';
import {WidgetsGallerySettingsHelper} from '../../utils/widgets-gallery-settings.helper';
import {WidgetsGalleryHelper} from '../../utils/widgets-gallery.helper';
import {WidgetsGalleryPreferences} from '../../types/widgets-gallery-settings.types';
import {WidgetsGallerySettingsDialog} from '../widgets-gallery-settings-dialog/widgets-gallery-settings-dialog';

@Component({
  selector: 'ats-customizable-widgets-gallery',
  imports: [TranslocoDirective, NzDrawerModule, WidgetsGalleryList, WidgetsGallerySubmenu, NzButtonModule, NzIconModule, NzAlertModule, NzSpinModule, WidgetsGallerySettingsDialog],
  templateUrl: './customizable-widgets-gallery.html',
  styleUrl: './customizable-widgets-gallery.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class CustomizableWidgetsGallery implements OnInit {
  readonly atsVisible = model(false);
  readonly widgets = input.required<WidgetMeta[]>();
  readonly language = input<string>();
  readonly dashboardType = input.required<DashboardType>();
  readonly disabled = input(false);
  readonly selected = output<string>();
  readonly resetDashboard = output();
  readonly settings = inject(WidgetsGallerySettingsService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly injector = inject(Injector);
  private readonly settingsButton = viewChild<unknown, ElementRef<HTMLButtonElement>>('settingsButton', {read: ElementRef});
  private readonly now = signal(Date.now());
  readonly settingsVisible = signal(false);
  readonly settingsClosing = signal(false);
  readonly saveFailed = signal(false);
  readonly othersOpen = signal(false);
  readonly newOpen = signal(false);
  readonly status = EntityStatus;
  readonly preferences = computed(() => WidgetsGallerySettingsHelper.preferences(this.settings.state().settings, this.dashboardType()));
  readonly display = computed(() => WidgetsGalleryHelper.display(this.widgets(), this.language(), this.now()));
  readonly sections = computed(() => WidgetsGalleryHelper.sections(this.display(), this.preferences()));

  constructor() {
    effect(() => {
      if (this.atsVisible()) {
        this.now.set(Date.now());
      }
    });

    effect(() => {
      this.dashboardType();
      if (this.disabled()) {
        this.atsVisible.set(false);
      }
      untracked(() => {
        this.settingsVisible.set(false);
        this.closeSubmenus();
      });
    });
  }

  ngOnInit(): void {
    this.settings.load();
  }

  close(): void {
    this.closeSubmenus();
    this.atsVisible.set(false);
  }

  closeSubmenus(): void {
    this.othersOpen.set(false);
    this.newOpen.set(false);
  }

  select(typeId: string): void {
    if (!this.disabled()) {
      this.selected.emit(typeId);
      this.close();
    }
  }

  reset(): void {
    if (!this.disabled()) {
      this.resetDashboard.emit();
      this.close();
    }
  }

  openSettings(): void {
    if (this.settings.state().saving || this.settings.state().status !== EntityStatus.Success || this.disabled()) {
      return;
    }
    this.closeSubmenus();
    this.saveFailed.set(false);
    this.settingsClosing.set(false);
    this.settingsVisible.set(true);
  }

  save(preferences: WidgetsGalleryPreferences): void {
    this.saveFailed.set(false);
    this.settings.save(this.dashboardType(), preferences).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(success => {
      this.saveFailed.set(!success);
      if (success) {
        this.settingsClosing.set(true);
      }
    });
  }

  closeSettings(): void {
    this.settingsVisible.set(false);
    afterNextRender(() => {
      this.settingsButton()?.nativeElement.focus();
    }, {injector: this.injector});
  }
}
