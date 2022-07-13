import { Component, EventEmitter, Input, Output } from '@angular/core';
import { WidgetNames } from "../../models/enums/widget-names";

@Component({
  selector: 'ats-widget-menu',
  templateUrl: './widget-menu.component.html',
  styleUrls: ['./widget-menu.component.less']
})
export class WidgetMenuComponent {

  @Input() public showedWidgets: string[] = [];
  @Output() public selected = new EventEmitter<string>();

  public widgetNames = WidgetNames;

  constructor() { }

}
