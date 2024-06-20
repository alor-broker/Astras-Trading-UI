import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output
} from '@angular/core';

@Component({
  selector: 'ats-terms-of-use-dialog-widget',
  templateUrl: './terms-of-use-dialog-widget.component.html',
  styleUrl: './terms-of-use-dialog-widget.component.less',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TermsOfUseDialogWidgetComponent {
  @Input({ required: true })
  atsVisible = false;

  @Output()
  atsVisibleChange = new EventEmitter<boolean>();

  handleClose(): void {
    this.atsVisible = false;
    this.atsVisibleChange.emit(this.atsVisible);
  }
}
