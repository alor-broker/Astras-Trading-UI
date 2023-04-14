import {
  Component,
  EventEmitter, Input,
  Output
} from '@angular/core';

@Component({
  selector: 'ats-ribbon-settings[guid]',
  templateUrl: './ribbon-settings.component.html',
  styleUrls: ['./ribbon-settings.component.less']
})
export class RibbonSettingsComponent {
  @Input()
  guid!: string;

  @Output()
  closed = new EventEmitter();

  handleCancel(): void {
    this.closed.emit();
  }
}
