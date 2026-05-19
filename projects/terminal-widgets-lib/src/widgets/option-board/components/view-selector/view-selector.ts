import {
  ChangeDetectionStrategy,
  Component,
  contentChildren,
  input,
  output,
  ViewEncapsulation
} from '@angular/core';
import {NgTemplateOutlet} from "@angular/common";
import {
  NzRadioComponent,
  NzRadioGroupComponent
} from "ng-zorro-antd/radio";
import {FormsModule} from "@angular/forms";
import {
  NzDropdownDirective,
  NzDropdownMenuComponent
} from "ng-zorro-antd/dropdown";
import {
  NzMenuDirective,
  NzMenuItemComponent
} from "ng-zorro-antd/menu";
import {NzButtonComponent} from "ng-zorro-antd/button";
import {NzIconDirective} from "ng-zorro-antd/icon";
import {ViewSelectorItem} from '@terminal-widgets-lib/widgets/option-board/components/view-selector-item/view-selector-item';

@Component({
  selector: 'ats-view-selector',
  imports: [
    NzRadioGroupComponent,
    FormsModule,
    NzRadioComponent,
    NgTemplateOutlet,
    NzDropdownMenuComponent,
    NzMenuDirective,
    NzMenuItemComponent,
    NzButtonComponent,
    NzIconDirective,
    NzDropdownDirective
  ],
  templateUrl: './view-selector.html',
  styleUrl: './view-selector.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class ViewSelector {
  readonly layout = input<'row' | 'menu'>('row');

  readonly items = contentChildren(ViewSelectorItem);

  readonly selectedView = input<string | null>(null);

  readonly selectionChange = output<string>();
}
