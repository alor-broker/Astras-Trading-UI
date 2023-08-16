import { Component, OnInit } from '@angular/core';
import { ModalService } from '../../../../shared/services/modal.service';
import { Observable, of, take } from 'rxjs';
import { ApplicationMetaService } from '../../services/application-meta.service';
import { filter } from 'rxjs/operators';
import { ReleaseMeta } from '../../models/application-release.model';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'ats-application-updated-widget',
  templateUrl: './application-updated-widget.component.html',
  styleUrls: ['./application-updated-widget.component.less']
})
export class ApplicationUpdatedWidgetComponent implements OnInit {
  isVisible$: Observable<boolean> = of(false);
  currentVersion$: Observable<ReleaseMeta | null> = of(null);

  isProblemCollapseActive = false;

  constructor(
    private readonly modalService: ModalService,
    private readonly applicationMetaService: ApplicationMetaService
  ) {
  }

  ngOnInit(): void {
    this.isVisible$ = this.modalService.shouldShowApplicationUpdatedModal$;
    this.currentVersion$ = this.modalService.applicationUpdatedParams$;
  }

  handleClose() {
    this.modalService.closeApplicationUpdatedModal();
  }

  handleConfirmedClose() {
    this.currentVersion$.pipe(
      take(1),
      filter(x => !!x)
    ).subscribe(release => {
      this.applicationMetaService.updateCurrentVersion(release!.id);
      this.handleClose();
    });
  }

  getLinkToRelease(release: ReleaseMeta): string {
    return `${environment.warpUrl}/ru/releases/release/${release.id}`;
  }

  isProblemCollapseActiveChange(isActive: boolean) {
    this.isProblemCollapseActive = isActive;
  }
}
