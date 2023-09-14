import {
  Component,
  EventEmitter,
  Input,
  Output
} from '@angular/core';

@Component({
  selector: 'ats-widget-settings',
  templateUrl: './widget-settings.component.html',
  styleUrls: ['./widget-settings.component.less']
})
export class WidgetSettingsComponent {

  @Input({ required: true })
  canSave = false;

  @Output()
  saveClick = new EventEmitter();

  @Input()
  showCopy = false;

  @Input({ required: true })
  canCopy = false;

  @Output()
  copyClick = new EventEmitter();
}
