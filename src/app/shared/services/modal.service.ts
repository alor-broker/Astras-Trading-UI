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
  private readonly shouldShowTerminalSettingsModal = new BehaviorSubject<boolean>(false);
  shouldShowTerminalSettingsModal$ = this.shouldShowTerminalSettingsModal.asObservable();

  private readonly shouldShowVoteModal = new BehaviorSubject<boolean>(false);
  private readonly voteParams = new BehaviorSubject<NewFeedback | null>(null);
  shouldShowVoteModal$ = this.shouldShowVoteModal.asObservable();
  voteParams$ = this.voteParams.asObservable();

  private readonly newsItem = new BehaviorSubject<NewsListItem | null>(null);
  private readonly shouldShowNewsModal = new BehaviorSubject<boolean>(false);
  newsItem$ = this.newsItem.asObservable();
  shouldShowNewsModal$ = this.shouldShowNewsModal.asObservable();

  private readonly shouldShowApplicationUpdatedModal = new BehaviorSubject<boolean>(false);
  private readonly applicationUpdatedParams = new BehaviorSubject<ReleaseMeta | null>(null);
  applicationUpdatedParams$ = this.applicationUpdatedParams.asObservable();
  shouldShowApplicationUpdatedModal$ = this.shouldShowApplicationUpdatedModal.asObservable();

  private readonly shouldShowEmptyPortfoliosWarningModal = new BehaviorSubject<boolean>(false);
  shouldShowEmptyPortfoliosWarningModal$ = this.shouldShowEmptyPortfoliosWarningModal.asObservable();

  constructor(
    private readonly nzModalService: NzModalService
  ) {
  }

  openTerminalSettingsModal(): void {
    this.shouldShowTerminalSettingsModal.next(true);
  }

  openNewsModal(newsItem: NewsListItem): void {
    this.shouldShowNewsModal.next(true);
    this.newsItem.next(newsItem);
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

  openEmptyPortfoliosWarningModal(): void {
    this.shouldShowEmptyPortfoliosWarningModal.next(true);
  }

  closeTerminalSettingsModal(): void {
    this.shouldShowTerminalSettingsModal.next(false);
  }

  closeNewsModal(): void {
    this.shouldShowNewsModal.next(false);
  }

  closeVoteModal(): void {
    this.shouldShowVoteModal.next(false);
    this.voteParams.next(null);
  }

  closeApplicationUpdatedModal(): void {
    this.shouldShowApplicationUpdatedModal.next(false);
    this.applicationUpdatedParams.next(null);
  }

  closeEmptyPortfoliosWarningModal(): void {
    this.shouldShowEmptyPortfoliosWarningModal.next(false);
  }
}
