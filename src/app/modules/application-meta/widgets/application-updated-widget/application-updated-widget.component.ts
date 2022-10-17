import {
  Component,
  OnInit
} from '@angular/core';
import { ModalService } from '../../../../shared/services/modal.service';
import {
  Observable,
  of
} from 'rxjs';
import { ApplicationMetaService } from '../../services/application-meta.service';

@Component({
  selector: 'ats-application-updated-widget',
  templateUrl: './application-updated-widget.component.html',
  styleUrls: ['./application-updated-widget.component.less']
})
export class ApplicationUpdatedWidgetComponent implements OnInit {
  isVisible$: Observable<boolean> = of(false);

  constructor(
    private readonly modalService: ModalService,
    private readonly applicationMetaService: ApplicationMetaService
  ) {
  }

  ngOnInit(): void {
    this.isVisible$ = this.modalService.shouldShowApplicationUpdatedModal$;
  }

  handleClose() {
    this.modalService.closeApplicationUpdatedModal();
  }

  handleConfirmedClose() {
    this.applicationMetaService.updateCurrentVersion();
    this.handleClose();
  }
}
