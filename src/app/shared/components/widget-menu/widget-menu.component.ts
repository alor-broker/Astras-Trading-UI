import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { WidgetNames } from "../../models/enums/widget-names";
import { Observable } from "rxjs";
import { DeviceService } from "../../services/device.service";
import { map } from "rxjs/operators";
import { WidgetsHelper } from "../../utils/widgets";

@Component({
  selector: 'ats-widget-menu',
  templateUrl: './widget-menu.component.html',
  styleUrls: ['./widget-menu.component.less']
})
export class WidgetMenuComponent implements OnInit {

  @Input() public showedWidgets: string[] = [];
  @Input() public showResetItem: boolean = false;
  @Output() public selected = new EventEmitter<string>();
  @Output() public resetDashboard = new EventEmitter<void>();

  public widgetNames = WidgetNames;
  public widgetsHelper = WidgetsHelper;
  public isMobile$!: Observable<boolean>;

  constructor(
    private readonly deviceService: DeviceService
  ) {}

  ngOnInit() {
    this.isMobile$ = this.deviceService.deviceInfo$.pipe(
      map(info => info.isMobile)
    );
  }
}
