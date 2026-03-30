import {Component, input, model, ViewEncapsulation, output} from '@angular/core';
import {WidgetCategory} from "../../../../shared/models/widget-meta.model";
import {NzDrawerComponent, NzDrawerContentDirective} from "ng-zorro-antd/drawer";
import {NgTemplateOutlet} from "@angular/common";
import {NzIconDirective} from "ng-zorro-antd/icon";
import {TranslocoDirective} from "@jsverse/transloco";

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
  selector: 'ats-widgets-gallery',
  templateUrl: './widgets-gallery.component.html',
  styleUrls: ['./widgets-gallery.component.less'],
  encapsulation: ViewEncapsulation.None,
  imports: [
    NzDrawerComponent,
    NzDrawerContentDirective,
    NgTemplateOutlet,
    NzIconDirective,
    TranslocoDirective
  ]
})
export class WidgetsGalleryComponent {
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
