import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { NewsListItem } from "../../modules/news/models/news.model";
import { NewFeedback } from '../../modules/feedback/models/feedback.model';
import { ReleaseMeta } from '../../modules/application-meta/models/application-release.model';
import { NzModalService } from "ng-zorro-antd/modal";
import { ModalOptions } from "ng-zorro-antd/modal/modal-types";

@Injectable({
  providedIn: 'root'
})
export class ModalService {
  private helpParams = new BehaviorSubject<string | null>(null);
  private shouldShowHelpModal = new BehaviorSubject<boolean>(false);

  private shouldShowTerminalSettingsModal = new BehaviorSubject<boolean>(false);

  private shouldShowVoteModal = new BehaviorSubject<boolean>(false);
  private voteParams = new BehaviorSubject<NewFeedback | null>(null);

  private newsItem = new BehaviorSubject<NewsListItem | null>(null);
  private shouldShowNewsModal = new BehaviorSubject<boolean>(false);

  private shouldShowApplicationUpdatedModal = new BehaviorSubject<boolean>(false);
  private applicationUpdatedParams = new BehaviorSubject<ReleaseMeta | null>(null);
  applicationUpdatedParams$ = this.applicationUpdatedParams.asObservable();

  helpParams$ = this.helpParams.asObservable();
  shouldShowHelpModal$ = this.shouldShowHelpModal.asObservable();

  shouldShowTerminalSettingsModal$ = this.shouldShowTerminalSettingsModal.asObservable();

  newsItem$ = this.newsItem.asObservable();

  shouldShowNewsModal$ = this.shouldShowNewsModal.asObservable();

  shouldShowVoteModal$ = this.shouldShowVoteModal.asObservable();
  voteParams$ = this.voteParams.asObservable();

  shouldShowApplicationUpdatedModal$  = this.shouldShowApplicationUpdatedModal.asObservable();

  constructor(
    private readonly nzModalService: NzModalService
  ) {
  }

  openHelpModal(helpRef: string) {
    this.shouldShowHelpModal.next(true);
    this.helpParams.next(helpRef);
  }

  openTerminalSettingsModal() {
    this.shouldShowTerminalSettingsModal.next(true);
  }

  openNewsModal(newsItem: NewsListItem) {
    this.shouldShowNewsModal.next(true);
    this.newsItem.next(newsItem);
  }

  openVoteModal(voteParams: NewFeedback) {
    this.voteParams.next(voteParams);
    this.shouldShowVoteModal.next(true);
  }

  openApplicationUpdatedModal(release: ReleaseMeta) {
    this.applicationUpdatedParams.next(release);
    this.shouldShowApplicationUpdatedModal.next(true);
  }

  openConfirmModal(options?: ModalOptions) {
    this.nzModalService.confirm(options);
  }

  closeTerminalSettingsModal() {
    this.shouldShowTerminalSettingsModal.next(false);
  }

  closeHelpModal() {
    this.shouldShowHelpModal.next(false);
  }

  closeNewsModal() {
    this.shouldShowNewsModal.next(false);
  }

  closeVoteModal() {
    this.shouldShowVoteModal.next(false);
    this.voteParams.next(null);
  }

  closeApplicationUpdatedModal() {
    this.shouldShowApplicationUpdatedModal.next(false);
    this.applicationUpdatedParams.next(null);
  }
}
