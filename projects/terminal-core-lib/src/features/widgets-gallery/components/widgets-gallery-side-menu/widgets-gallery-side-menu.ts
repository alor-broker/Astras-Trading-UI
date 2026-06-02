import {
  ChangeDetectionStrategy,
  Component,
  input,
  model,
  output,
  ViewEncapsulation
} from '@angular/core';
import {WidgetCategory} from '../../services/widgets-meta-service.types';
import {TranslocoDirective} from '@jsverse/transloco';
import {
  NzDrawerComponent,
  NzDrawerContentDirective
} from 'ng-zorro-antd/drawer';
import {NgTemplateOutlet} from '@angular/common';
import {NzIconDirective} from 'ng-zorro-antd/icon';

export interface WidgetDisplay {
  typeId: string;
  icon: string;
  name: string;
}

export interface WidgetGroup {
  category: WidgetCategory;
  widgets: WidgetDisplay[];
}

export interface GalleryDisplay {
  allCategory: WidgetGroup;
  groups: WidgetGroup[];
}

@Component({
  selector: 'ats-widgets-gallery-side-menu',
  imports: [
    TranslocoDirective,
    NzDrawerComponent,
    NgTemplateOutlet,
    NzIconDirective,
    NzDrawerContentDirective
  ],
  templateUrl: './widgets-gallery-side-menu.html',
  styleUrl: './widgets-gallery-side-menu.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class WidgetsGallerySideMenu {
  readonly atsVisible = model(false);

  readonly gallery = input<GalleryDisplay | null>(null);

  readonly showResetBtn = input(true);

  readonly closable = input(false);

  readonly activeWidget = input<string | null>(null);

  readonly selected = output<string>();

  readonly resetDashboard = output();

  close(): void {
    this.atsVisible.set(false);
  }

  reset(): void {
    this.resetDashboard.emit();
    this.close();
  }

  selectWidget(widget: WidgetDisplay): void {
    this.selected.emit(widget.typeId);
    this.close();
  }
}
