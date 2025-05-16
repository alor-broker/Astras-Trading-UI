import {
  Component,
  EventEmitter,
  Input,
  Output,
  ViewEncapsulation,
} from '@angular/core';
import { WidgetCategory } from "../../../../shared/models/widget-meta.model";
import {NzDrawerComponent, NzDrawerContentDirective} from "ng-zorro-antd/drawer";
import {NgForOf, NgIf, NgTemplateOutlet} from "@angular/common";
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
        NgIf,
        NgForOf,
        NgTemplateOutlet,
        NzIconDirective,
        TranslocoDirective
    ]
})
export class WidgetsGalleryComponent {
  @Input({ required: true })
  atsVisible = false;

  @Input({ required: true })
  gallery: GalleryDisplay | null = null;

  @Input()
  showResetBtn = true;

  @Input()
  activeWidget: string | null = null;

  @Output()
  selected = new EventEmitter<string>();

  @Output()
  resetDashboard = new EventEmitter<void>();

  @Output()
  atsVisibleChange = new EventEmitter<boolean>();

  close(): void {
    this.atsVisible = false;
    this.atsVisibleChange.emit(this.atsVisible);
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
