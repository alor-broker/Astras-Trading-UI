import { Injectable, inject } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { NewFeedback } from '../../modules/feedback/models/feedback.model';
import { ReleaseMeta } from '../../modules/application-meta/models/application-release.model';
import {
  ModalOptions,
  NzModalService
} from "ng-zorro-antd/modal";

@Injectable({
  providedIn: 'root'
})
export class ModalService {
  private readonly nzModalService = inject(NzModalService);

  private readonly shouldShowTerminalSettingsModal = new BehaviorSubject<boolean>(false);
  shouldShowTerminalSettingsModal$ = this.shouldShowTerminalSettingsModal.asObservable();
  private readonly shouldShowVoteModal = new BehaviorSubject<boolean>(false);
  private readonly voteParams = new BehaviorSubject<NewFeedback | null>(null);
  shouldShowVoteModal$ = this.shouldShowVoteModal.asObservable();
  voteParams$ = this.voteParams.asObservable();

  private readonly shouldShowApplicationUpdatedModal = new BehaviorSubject<boolean>(false);
  private readonly applicationUpdatedParams = new BehaviorSubject<ReleaseMeta | null>(null);
  applicationUpdatedParams$ = this.applicationUpdatedParams.asObservable();
  shouldShowApplicationUpdatedModal$ = this.shouldShowApplicationUpdatedModal.asObservable();

  openTerminalSettingsModal(): void {
    this.shouldShowTerminalSettingsModal.next(true);
  }

  openVoteModal(voteParams: NewFeedback): void {
    this.voteParams.next(voteParams);
    this.shouldShowVoteModal.next(true);
  }

  openApplicationUpdatedModal(release: ReleaseMeta): void {
    this.applicationUpdatedParams.next(release);
    this.shouldShowApplicationUpdatedModal.next(true);
  }

  openConfirmModal(options?: ModalOptions): void {
    this.nzModalService.confirm(options);
  }

  closeTerminalSettingsModal(): void {
    this.shouldShowTerminalSettingsModal.next(false);
  }

  closeVoteModal(): void {
    this.shouldShowVoteModal.next(false);
    this.voteParams.next(null);
  }

  closeApplicationUpdatedModal(): void {
    this.shouldShowApplicationUpdatedModal.next(false);
    this.applicationUpdatedParams.next(null);
  }
}
