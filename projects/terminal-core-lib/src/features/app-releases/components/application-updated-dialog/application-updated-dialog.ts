import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  ViewEncapsulation
} from '@angular/core';
import {
  Observable,
  of,
  take
} from 'rxjs';
import {filter} from 'rxjs/operators';
import {TranslocoDirective} from '@jsverse/transloco';
import {
  NzModalComponent,
  NzModalContentDirective
} from 'ng-zorro-antd/modal';
import {NzDividerComponent} from 'ng-zorro-antd/divider';
import {
  NzCollapseComponent,
  NzCollapsePanelComponent
} from 'ng-zorro-antd/collapse';
import {NzTypographyComponent} from 'ng-zorro-antd/typography';
import {NzIconDirective} from 'ng-zorro-antd/icon';
import {AsyncPipe} from '@angular/common';
import {AppReleaseService} from '../../services/app-release.service';
import {ReleaseMeta} from '../../services/app-releases-service.types';

@Component({
  selector: 'ats-application-updated-dialog',
  templateUrl: './application-updated-dialog.html',
  styleUrls: ['./application-updated-dialog.less'],
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
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class ApplicationUpdatedWidgetComponent implements OnInit {
  isVisible$: Observable<boolean> = of(false);

  currentVersion$: Observable<ReleaseMeta | null> = of(null);

  isProblemCollapseActive = false;

  private readonly appReleaseService = inject(AppReleaseService);

  ngOnInit(): void {
    this.currentVersion$ = this.appReleaseService.appUpdatedDialogParams$;
  }

  handleClose(): void {
    this.currentVersion$.pipe(
      take(1),
      filter(x => !!x)
    ).subscribe(release => {
      this.appReleaseService.updateCurrentVersion(release!.id);
      this.appReleaseService.closeAppUpdatedDialog();
    });
  }
}
