import {
  Component,
  DestroyRef,
  OnInit,
  TemplateRef,
  ViewChild,
  ViewEncapsulation,
} from '@angular/core';
import {
  NzNotificationComponent,
  NzNotificationService
} from "ng-zorro-antd/notification";
import {
  take,
  timer
} from "rxjs";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { switchMap } from "rxjs/operators";
import { TranslatorService } from "../../../../shared/services/translator.service";
import { UrgentNotificationsService } from "../../services/urgent-notifications.service";
import { LocalStorageService } from "../../../../shared/services/local-storage.service";

@Component({
  selector: 'ats-urgent-notification-dialog',
  imports: [],
  template: `
    <ng-template let-notification="data">
      @if (notification.link != null) {
        <a [href]="notification.link" target="_blank">{{ notification.text }}</a>
      } @else {
        <span>{{ notification.text }}</span>
      }
    </ng-template>
  `,
  styleUrl: './urgent-notification-dialog.component.less',
  encapsulation: ViewEncapsulation.None
})
export class UrgentNotificationDialogComponent implements OnInit {
  @ViewChild(TemplateRef, {static: false})
  template?: TemplateRef<{
    $implicit: NzNotificationComponent;
    data: { link: string | null, text: string };
  }>;

  private readonly readNotificationsStorageKey = 'readUrgentNotifications';

  private readonly poolIntervalSec = 30;

  private readonly openedNotifications = new Set<string>();

  constructor(
    private readonly urgentNotificationsService: UrgentNotificationsService,
    private readonly nzNotificationService: NzNotificationService,
    private readonly localStorageService: LocalStorageService,
    private readonly translatorService: TranslatorService,
    private readonly destroyRef: DestroyRef
  ) {
  }

  ngOnInit(): void {
    timer(10_000, this.poolIntervalSec * 1000).pipe(
      switchMap(() => this.urgentNotificationsService.getNotifications()),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(response => {
      if (response == null || !response.active || response.cards.length === 0) {
        // ***
      } else {
        const readItems = this.getReadNotifications();

        const newNotifications = response.cards
          .filter(i => !readItems.includes(i.id))
          .sort((a, b) => a.cardOrder - b.cardOrder);

        this.openedNotifications.forEach((notificationId) => {
          this.nzNotificationService.remove(notificationId);
        });

        this.openedNotifications.clear();

        if (newNotifications.length > 0) {
          this.translatorService.getTranslator('urgent-notifications').pipe(
            take(1),
          ).subscribe(translator => {
            newNotifications.forEach((notification) => {
              let title = notification.title;
              const text = notification.text ?? title;
              if (notification.text == null) {
                title = translator(['notificationTitle']);
              }

              const nzNotification = this.nzNotificationService.warning(
                title,
                this.template!,
                {
                  nzKey: notification.id.toString(),
                  nzDuration: 0,
                  nzPlacement: "top",
                  nzClass: 'urgent-notification',
                  nzData: {
                    text,
                    link: notification.link
                  }
                }
              );

              nzNotification.onClose.pipe(
                take(1)
              ).subscribe(() => {
                this.setReadNotifications(
                  [
                    ...this.getReadNotifications(),
                    notification.id
                  ]
                );
              });

              this.openedNotifications.add(nzNotification.messageId);
            });
          });
        }
      }
    });
  }

  private getReadNotifications(): number[] {
    return this.localStorageService.getItem<number[]>(this.readNotificationsStorageKey) ?? [];
  }

  private setReadNotifications(ids: number[]): void {
    this.localStorageService.setItem(this.readNotificationsStorageKey, Array.from(new Set(ids)));
  }
}
