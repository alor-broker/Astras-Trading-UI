import {
  Component,
  ContentChildren,
  EventEmitter,
  Input,
  Output,
  QueryList
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
  @Input()
  layout: 'row' | 'menu' = 'row';

  @ContentChildren(ViewSelectorItemComponent)
  items!: QueryList<ViewSelectorItemComponent>;

  @Input()
  selectedView: string | null = null;

  @Output()
  selectionChange = new EventEmitter<string>();
}
