import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output
} from '@angular/core';

@Component({
    selector: 'ats-terms-of-use-dialog',
    templateUrl: './terms-of-use-dialog.component.html',
    styleUrl: './terms-of-use-dialog.component.less',
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false
})
export class TermsOfUseDialogComponent {
  @Input({ required: true })
  atsVisible = false;

  @Output()
  atsVisibleChange = new EventEmitter<boolean>();

  @Output()
  confirmed = new EventEmitter<boolean>();

  private handleClose(): void {
    this.atsVisible = false;
    this.atsVisibleChange.emit(this.atsVisible);
  }

  handleOk(): void {
    this.confirmed.emit(true);
    this.handleClose();
  }

  handleCancel(): void {
    this.confirmed.emit(false);
    this.handleClose();
  }
}
