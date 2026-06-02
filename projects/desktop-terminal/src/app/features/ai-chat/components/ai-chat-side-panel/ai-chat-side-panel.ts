import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  model,
  OnChanges,
  OnInit,
  signal,
  SimpleChanges,
  ViewEncapsulation
} from '@angular/core';
import {LocalStorageService} from "@terminal-core-lib/features/local-storage/local-storage.service";
import {USER_CONTEXT} from '@terminal-core-lib/features/user-context/user-context.types';
import {
  filter,
  fromEvent,
  map,
  Observable,
  Subscription,
  take
} from 'rxjs';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {User} from '@terminal-core-lib/features/user-context/user.types';
import {TranslocoDirective} from '@jsverse/transloco';
import {NzDrawerComponent} from 'ng-zorro-antd/drawer';
import {AsyncPipe} from '@angular/common';
import {NzTypographyComponent} from 'ng-zorro-antd/typography';
import {AiChatTermsOfUseDialog} from '../ai-chat-terms-of-use-dialog/ai-chat-terms-of-use-dialog';
import {AiChat} from '../ai-chat/ai-chat';

@Component({
  selector: 'atsd-ai-chat-side-panel',
  imports: [
    TranslocoDirective,
    NzDrawerComponent,
    AsyncPipe,
    NzTypographyComponent,
    AiChatTermsOfUseDialog,
    AiChat
  ],
  templateUrl: './ai-chat-side-panel.html',
  styleUrl: './ai-chat-side-panel.less',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AiChatSidePanel implements OnInit, OnChanges {
  readonly atsVisible = model(false);

  isResizing = false;

  drawerWidth$!: Observable<number>;

  isChatDisabled = true;

  protected readonly isTermOfUseDialogVisible = signal(false);

  private readonly localStorageService = inject(LocalStorageService);

  private readonly userContext = inject(USER_CONTEXT);

  private readonly destroyRef = inject(DestroyRef);

  private mouseupSub?: Subscription;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes["atsVisible"] != null) {
      if (changes["atsVisible"].previousValue === false
        && changes["atsVisible"].currentValue === true
        && this.isChatDisabled) {
        setTimeout(() => {
          this.isTermOfUseDialogVisible.set(true);
        });
      }
    }
  }

  ngOnInit(): void {
    this.userContext.getUser().pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(user => {
      this.isChatDisabled = this.localStorageService.getStringItem(this.getTermsOfUseAgreementKey(user)) == null;
    });

    this.initResize();
  }

  close(): void {
    this.atsVisible.set(false);
  }

  setTermsOfUseAgreement(isConfirmed: boolean): void {
    if (isConfirmed) {
      this.userContext.getUser().pipe(
        take(1)
      ).subscribe(user => {
        this.localStorageService.setItem(this.getTermsOfUseAgreementKey(user), '');
        this.isChatDisabled = false;
      });
    } else if (this.isChatDisabled) {
      this.atsVisible.set(false);
    }
  }

  isResizingChange(v: boolean): void {
    this.isResizing = v;
  }

  drawerVisibleChange(isVisible: boolean): void {
    if (isVisible) {
      this.mouseupSub = fromEvent(document, 'mouseup')
        .pipe(
          filter(() => this.isResizing)
        )
        .subscribe(() => {
          this.isResizingChange(false);
        });
    } else {
      this.mouseupSub?.unsubscribe();
    }
  }

  private getTermsOfUseAgreementKey(user: User): string {
    return `ai_chat_tou_agreement_${user.clientId}`;
  }

  private initResize(): void {
    this.drawerWidth$ = fromEvent<MouseEvent>(document, 'mousemove')
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        filter(() => this.isResizing),
        map(e => {
          return Math.max(375, document.body.clientWidth - e.clientX);
        })
      );
  }
}
