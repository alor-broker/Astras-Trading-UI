import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { BehaviorSubject } from 'rxjs';
import { CommandParams } from '../models/commands/command-params.model';
import { EditParams } from '../models/commands/edit-params.model';
import { PortfolioKey } from '../models/portfolio-key.model';
import { getSelectedPortfolio } from '../../store/portfolios/portfolios.selectors';
import { NewsListItem } from "../../modules/news/models/news.model";

@Injectable({
  providedIn: 'root'
})
export class ModalService {
  private selectedPortfolio?: PortfolioKey;

  private shouldShowCommandModal = new BehaviorSubject<boolean>(false);
  private commandParams = new BehaviorSubject<CommandParams | null>(null);

  private editParams = new BehaviorSubject<EditParams | null>(null);
  private shouldShowEditModal = new BehaviorSubject<boolean>(false);

  private helpParams = new BehaviorSubject<string | null>(null);
  private shouldShowHelpModal = new BehaviorSubject<boolean>(false);

  private shouldShowTerminalSettingsModal = new BehaviorSubject<boolean>(false);

  private newsItem = new BehaviorSubject<NewsListItem | null>(null);
  private shouldShowNewsModal = new BehaviorSubject<boolean>(false);

  shouldShowCommandModal$ = this.shouldShowCommandModal.asObservable();
  commandParams$ = this.commandParams.asObservable();

  editParams$ = this.editParams.asObservable();
  shouldShowEditModal$ = this.shouldShowEditModal.asObservable();

  helpParams$ = this.helpParams.asObservable();
  shouldShowHelpModal$ = this.shouldShowHelpModal.asObservable();

  shouldShowTerminalSettingsModal$ = this.shouldShowTerminalSettingsModal.asObservable();

  newsItem$ = this.newsItem.asObservable();
  shouldShowNewsModal$ = this.shouldShowNewsModal.asObservable();

  constructor(private store: Store) {
    this.store.select(getSelectedPortfolio).subscribe(p => {
      if (p) {
        this.selectedPortfolio = p;
      }
    });
  }

  openCommandModal(data: CommandParams) {
    this.shouldShowCommandModal.next(true);
    const portfolio = this.selectedPortfolio;
    if (portfolio) {
      this.commandParams.next({
        ...data,
        user: portfolio
      });
    }
  }

  openEditModal(data: EditParams) {
    this.shouldShowEditModal.next(true);
    this.editParams.next(data);
  }

  openHelpModal(widgetName: string) {
    this.shouldShowHelpModal.next(true);
    this.helpParams.next(widgetName);
  }

  openTerminalSettingsModal() {
    this.shouldShowTerminalSettingsModal.next(true);
  }

  openNewsModal(newsItem: NewsListItem) {
    this.shouldShowNewsModal.next(true);
    this.newsItem.next(newsItem);
  }

  closeTerminalSettingsModal() {
    this.shouldShowTerminalSettingsModal.next(false);
  }

  closeCommandModal() {
    this.shouldShowCommandModal.next(false);
  }

  closeEditModal() {
    this.shouldShowEditModal.next(false);
  }

  closeHelpModal() {
    this.shouldShowHelpModal.next(false);
  }

  closeNewsModal() {
    this.shouldShowNewsModal.next(false);
  }
}
