import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { BlotterService } from '../../services/blotter.service';

@Component({
  selector: 'ats-blotter-widget[shouldShowSettings][guid][linkedToActive]',
  templateUrl: './blotter-widget.component.html',
  styleUrls: ['./blotter-widget.component.less'],
  providers: [BlotterService]
})
export class BlotterWidgetComponent implements OnInit {
  @Input()
  shouldShowSettings!: boolean;
  @Input('linkedToActive') set linkedToActive(linkedToActive: boolean) {
    this.service.setLinked(linkedToActive);
  }
  @Input()
  guid!: string

  @Output()
  shouldShowSettingsChange = new EventEmitter<boolean>()

  constructor(private service: BlotterService) { }

  ngOnInit(): void {
  }

  onSettingsChange() {
    this.shouldShowSettingsChange.emit(!this.shouldShowSettings);
  }
}
