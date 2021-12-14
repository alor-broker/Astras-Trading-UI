import { Component, Input, OnInit } from '@angular/core';
import { DashboardItem } from 'src/app/shared/models/dashboard-item.model';
import { DashboardService } from '../../services/dashboard.service';

@Component({
  selector: 'ats-widget-header',
  templateUrl: './widget-header.component.html',
  styleUrls: ['./widget-header.component.sass']
})
export class WidgetHeaderComponent implements OnInit {
  @Input()
  widget!: DashboardItem;

  constructor(private service: DashboardService) { }

  ngOnInit() {
  }


  removeItem($event: MouseEvent | TouchEvent, item : any): void {
    $event.preventDefault();
    $event.stopPropagation();
    this.service.removeWidget(item);
  }
}
