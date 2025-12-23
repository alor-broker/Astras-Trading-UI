import { Component, OnInit, inject } from '@angular/core';
import { ModalService } from '../../../../shared/services/modal.service';
import { Observable, of, take } from 'rxjs';
import { ApplicationMetaService } from '../../services/application-meta.service';
import { filter } from 'rxjs/operators';
import { ReleaseMeta } from '../../models/application-release.model';
import { TranslocoDirective } from '@jsverse/transloco';
import { NzModalComponent, NzModalContentDirective } from 'ng-zorro-antd/modal';
import { NzDividerComponent } from 'ng-zorro-antd/divider';
import { NzCollapseComponent, NzCollapsePanelComponent } from 'ng-zorro-antd/collapse';
import { NzTypographyComponent } from 'ng-zorro-antd/typography';
import { NzIconDirective } from 'ng-zorro-antd/icon';
import { AsyncPipe } from '@angular/common';

@Component({
    selector: 'ats-application-updated-widget',
    templateUrl: './application-updated-widget.component.html',
    styleUrls: ['./application-updated-widget.component.less'],
    imports: [
      TranslocoDirective,
      NzModalComponent,
      NzModalContentDirective,
      NzDividerComponent,
      NzCollapseComponent,
      NzCollapsePanelComponent,
      NzTypographyComponent,
      NzIconDirective,
      AsyncPipe
    ]
})
export class ApplicationUpdatedWidgetComponent implements OnInit {
  private readonly modalService = inject(ModalService);
  private readonly applicationMetaService = inject(ApplicationMetaService);

  isVisible$: Observable<boolean> = of(false);
  currentVersion$: Observable<ReleaseMeta | null> = of(null);

  isProblemCollapseActive = false;

  ngOnInit(): void {
    this.isVisible$ = this.modalService.shouldShowApplicationUpdatedModal$;
    this.currentVersion$ = this.modalService.applicationUpdatedParams$;
  }

  handleClose(): void {
    this.currentVersion$.pipe(
      take(1),
      filter(x => !!x)
    ).subscribe(release => {
      this.applicationMetaService.updateCurrentVersion(release!.id);
      this.modalService.closeApplicationUpdatedModal();
    });
  }
}
