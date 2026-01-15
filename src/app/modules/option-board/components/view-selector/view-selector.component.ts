import {
  Component,
  input,
  output,
  contentChildren
} from '@angular/core';
import { ViewSelectorItemComponent } from "../view-selector-item/view-selector-item.component";
import { NgTemplateOutlet } from "@angular/common";
import {
  NzRadioComponent,
  NzRadioGroupComponent
} from "ng-zorro-antd/radio";
import { FormsModule } from "@angular/forms";
import {
  NzDropDownDirective,
  NzDropdownMenuComponent
} from "ng-zorro-antd/dropdown";
import {
  NzMenuDirective,
  NzMenuItemComponent
} from "ng-zorro-antd/menu";
import { NzButtonComponent } from "ng-zorro-antd/button";
import { NzIconDirective } from "ng-zorro-antd/icon";

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
        NzDropDownDirective,
        NzIconDirective
    ],
    templateUrl: './view-selector.component.html',
    styleUrl: './view-selector.component.less'
})
export class ViewSelectorComponent {
  readonly layout = input<'row' | 'menu'>('row');

  readonly items = contentChildren(ViewSelectorItemComponent);

  readonly selectedView = input<string | null>(null);

  readonly selectionChange = output<string>();
}
