import {
  Component,
  EventEmitter,
  Input,
  Output,
  ViewEncapsulation,
} from '@angular/core';
import { WidgetCategory } from "../../../../shared/models/widget-meta.model";

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
  encapsulation: ViewEncapsulation.None
})
export class WidgetsGalleryComponent {
  @Input({ required: true })
  atsVisible = false;

  @Input({ required: true })
  gallery: GalleryDisplay | null = null;

  @Input()
  isMobile = false;

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
