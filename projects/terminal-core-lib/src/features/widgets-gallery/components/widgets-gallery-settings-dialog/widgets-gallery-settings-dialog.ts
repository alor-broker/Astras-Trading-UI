import {ChangeDetectionStrategy, Component, computed, effect, inject, input, OnInit, output, signal, ViewEncapsulation} from '@angular/core';
import {AsyncPipe} from '@angular/common';
import {HelpService} from '../../../help-docs/services/help.service';
import {FormControl, FormGroup, ReactiveFormsModule} from '@angular/forms';
import {TranslocoDirective} from '@jsverse/transloco';
import {NzModalModule} from 'ng-zorro-antd/modal';
import {NzButtonModule} from 'ng-zorro-antd/button';
import {NzCheckboxModule} from 'ng-zorro-antd/checkbox';
import {NzIconModule} from 'ng-zorro-antd/icon';
import {NzAlertModule} from 'ng-zorro-antd/alert';
import {NzTooltipModule} from 'ng-zorro-antd/tooltip';
import {GalleryWidget, WidgetsGalleryHelper} from '../../utils/widgets-gallery.helper';
import {FavoriteWidgetPreferences, WidgetsGalleryPreferences} from '../../types/widgets-gallery-settings.types';
import {DashboardType} from '../../../dashboard/types/dashboard.types';
import {WidgetsGallerySettingsHelper} from '../../utils/widgets-gallery-settings.helper';

@Component({
  selector: 'ats-widgets-gallery-settings-dialog',
  imports: [AsyncPipe, TranslocoDirective, ReactiveFormsModule, NzModalModule, NzButtonModule, NzCheckboxModule, NzIconModule, NzAlertModule, NzTooltipModule],
  templateUrl: './widgets-gallery-settings-dialog.html',
  styleUrl: './widgets-gallery-settings-dialog.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class WidgetsGallerySettingsDialog implements OnInit {
  readonly widgets = input.required<GalleryWidget[]>();
  readonly preferences = input.required<WidgetsGalleryPreferences>();
  readonly dashboardType = input.required<DashboardType>();
  readonly saving = input(false);
  readonly saveFailed = input(false);
  readonly closeRequested = input(false);
  readonly closing = signal(false);
  readonly saved = output<WidgetsGalleryPreferences>();
  readonly closed = output();
  private readonly helpService = inject(HelpService);

  readonly groups = computed(() => WidgetsGalleryHelper.group(this.widgets()).map(group => ({
    ...group,
    widgets: group.widgets.map(widget => ({...widget, helpUrl$: this.helpService.getWidgetHelp(widget.typeId)}))
  })));

  readonly favorites = signal<ReadonlyMap<string, FavoriteWidgetPreferences>>(new Map());
  readonly form = new FormGroup({
    showOtherCategories: new FormControl(true, {nonNullable: true}),
    showFavoriteCategories: new FormControl(false, {nonNullable: true})
  });

  constructor() {
    effect(() => {
      if (this.closeRequested()) {
        this.closing.set(true);
      }
    });
    effect(() => {
      if (this.saving()) {
        this.form.disable();
      } else {
        this.form.enable();
      }
    });
  }

  ngOnInit(): void {
    this.applyPreferences(this.preferences());
  }

  resetDefaults(): void {
    if (!this.saving()) {
      this.applyPreferences(WidgetsGallerySettingsHelper.preferences(WidgetsGallerySettingsHelper.empty(), this.dashboardType()));
    }
  }

  toggleFavorite(typeId: string): void {
    if (this.saving()) {
      return;
    }
    this.favorites.update(previous => {
      const next = new Map(previous);
      if (next.has(typeId)) {
        next.delete(typeId);
      } else {
        next.set(typeId, {typeId});
      }
      return next;
    });
  }

  save(): void {
    if (!this.saving()) {
      this.saved.emit({...this.form.getRawValue(), favoriteWidgets: [...this.favorites().values()]});
    }
  }

  cancel(): void {
    if (!this.saving()) {
      this.closing.set(true);
    }
  }

  private applyPreferences(preferences: WidgetsGalleryPreferences): void {
    this.favorites.set(new Map(preferences.favoriteWidgets.map(widget => [widget.typeId, {...widget}])));
    this.form.setValue({
      showOtherCategories: preferences.showOtherCategories,
      showFavoriteCategories: preferences.showFavoriteCategories
    });
  }
}
