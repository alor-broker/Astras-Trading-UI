import {
  Component,
  DestroyRef,
  EventEmitter,
  Inject,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges
} from '@angular/core';
import { LocalStorageService } from "../../../../shared/services/local-storage.service";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { User } from "../../../../shared/models/user/user.model";
import { take } from "rxjs";
import {
  USER_CONTEXT,
  UserContext
} from "../../../../shared/services/auth/user-context";

@Component({
  selector: 'ats-side-chat-widget',
  templateUrl: './side-chat-widget.component.html',
  styleUrls: ['./side-chat-widget.component.less']
})
export class SideChatWidgetComponent implements OnInit, OnChanges {
  @Input({ required: true })
  atsVisible = false;

  @Output()
  atsVisibleChange = new EventEmitter<boolean>();

  isTermOfUseDialogVisible = false;
  isChatDisabled = true;

  constructor(
    private readonly localStorageService: LocalStorageService,
    @Inject(USER_CONTEXT)
    private readonly userContext: UserContext,
    private readonly destroyRef: DestroyRef
  ) {
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.atsVisible != null) {
      if (changes.atsVisible.previousValue === false
        && changes.atsVisible.currentValue === true
        && this.isChatDisabled) {
        setTimeout(() => {
          this.isTermOfUseDialogVisible = true;
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
  }

  close(): void {
    this.atsVisible = false;
    this.atsVisibleChange.emit(this.atsVisible);
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
      this.atsVisible = false;
      this.atsVisibleChange.emit(this.atsVisible);
    }
  }

  private getTermsOfUseAgreementKey(user: User): string {
    return `ai_chat_tou_agreement_${user.clientId}`;
  }
}
