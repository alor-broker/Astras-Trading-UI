import {ChangeDetectionStrategy, Component, computed, input, output, ViewEncapsulation} from '@angular/core';
import {NgTemplateOutlet} from '@angular/common';
import {TranslocoDirective} from '@jsverse/transloco';
import {NzMenuModule} from 'ng-zorro-antd/menu';
import {NzIconModule} from 'ng-zorro-antd/icon';
import {NzTooltipModule} from 'ng-zorro-antd/tooltip';
import {GalleryWidget, WidgetsGalleryHelper} from '../../utils/widgets-gallery.helper';

@Component({
  selector: 'ats-widgets-gallery-list',
  imports: [NgTemplateOutlet, TranslocoDirective, NzMenuModule, NzIconModule, NzTooltipModule],
  templateUrl: './widgets-gallery-list.html',
  styleUrl: './widgets-gallery-list.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class WidgetsGalleryList {
  readonly widgets = input.required<GalleryWidget[]>();
  readonly categories = input(false);
  readonly disabled = input(false);
  readonly showNewBadge = input(true);
  readonly selected = output<string>();
  readonly groups = computed(() => WidgetsGalleryHelper.group(this.widgets()));
}
