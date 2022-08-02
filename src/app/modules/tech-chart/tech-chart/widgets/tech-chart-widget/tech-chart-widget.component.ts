import {
  Component,
  EventEmitter,
  Input,
  Output
} from '@angular/core';

@Component({
  selector: 'ats-tech-chart-widget[shouldShowSettings][guid]',
  templateUrl: './tech-chart-widget.component.html',
  styleUrls: ['./tech-chart-widget.component.less']
})
export class TechChartWidgetComponent {
  @Input()
  shouldShowSettings!: boolean;
  @Input()
  guid!: string;
  @Output()
  shouldShowSettingsChange = new EventEmitter<boolean>();

  constructor() {
  }

  onSettingsChange() {
    this.shouldShowSettingsChange.emit(!this.shouldShowSettings);
  }
}
