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
import {
  isAfter,
  isBefore
} from "date-fns";
import { ExternalLinkComponent } from "../../../../shared/components/external-link/external-link.component";

@Component({
  selector: 'ats-urgent-notification-dialog',
  imports: [
    ExternalLinkComponent
  ],
  template: `
    <ng-template let-notification="data">
      @if (notification.link != null && notification.link.length > 0) {
        <ats-external-link [href]="notification.link">
          {{ notification.text }}
        </ats-external-link>
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

  private readonly poolIntervalSec = 60;

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
      if(response == null || !response.active || response.cards.length === 0) {
        return;
      }

      const readItems = this.getReadNotifications();

      const newNotifications = response.cards
        .filter(card => {
          const hasTitle = card.title != null && card.title.length > 0;
          const isActivatedByTime = card.activeFrom != null
            ? isAfter(new Date(), card.activeFrom)
            : true;
          const isNotExpired = card.activeTo != null
            ? isBefore(new Date(), card.activeTo)
            : true;

          return hasTitle && isActivatedByTime && isNotExpired;
        })
        .filter(i => !readItems.includes(i.id))
        .sort((a, b) => (a.cardOrder ?? 0) - (b.cardOrder ?? 0));

      this.openedNotifications.forEach((notificationId) => {
        this.nzNotificationService.remove(notificationId);
      });

      this.openedNotifications.clear();

      if (newNotifications.length > 0) {
        this.translatorService.getTranslator('urgent-notifications').pipe(
          take(1),
        ).subscribe(translator => {
          newNotifications.forEach((notification) => {
            const nzNotification = this.nzNotificationService.warning(
              translator(['notificationTitle']),
              this.template!,
              {
                nzKey: notification.id.toString(),
                nzDuration: 0,
                nzPlacement: "top",
                nzClass: 'urgent-notification',
                nzData: {
                  text: notification.title,
                  link: notification.link
                }
              }
            );

            nzNotification.onClose.pipe(
              take(1)
            ).subscribe(() => {
              this.setReadNotifications(
                [
                  ...this.getReadNotifications().slice(-100),
                  notification.id
                ]
              );
            });

            this.openedNotifications.add(nzNotification.messageId);
          });
        });
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
