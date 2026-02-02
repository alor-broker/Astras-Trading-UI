import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WidgetInstance } from '../../../../shared/models/dashboard/dashboard-item.model';
import { OperationsHistoryComponent } from '../../components/operations-history/operations-history.component';

@Component({
  selector: 'ats-operations-history-widget',
  standalone: true,
  imports: [
    CommonModule,
    OperationsHistoryComponent
  ],
  templateUrl: './operations-history-widget.component.html',
  styleUrls: ['./operations-history-widget.component.less']
})
export class OperationsHistoryWidgetComponent implements OnInit {
  @Input() widgetInstance!: WidgetInstance;
  @Input() isBlockWidget!: boolean;

  constructor() { }

  ngOnInit(): void {
  }
}
