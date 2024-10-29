import {
  Component,
  OnDestroy,
  OnInit
} from '@angular/core';
import { NzButtonComponent } from "ng-zorro-antd/button";
import { TranslocoDirective } from "@jsverse/transloco";
import { BehaviorSubject } from "rxjs";
import { AsyncPipe } from "@angular/common";
import { LetDirective } from "@ngrx/component";
import { NzTypographyComponent } from "ng-zorro-antd/typography";
import { SearchClientPortfolioDialogComponent } from "../search-client-portfolio-dialog/search-client-portfolio-dialog.component";
import { NzIconDirective } from "ng-zorro-antd/icon";
import { PortfolioKey } from "../../../shared/models/portfolio-key.model";

@Component({
  selector: 'ats-select-client-portfolio-btn',
  standalone: true,
  imports: [
    NzButtonComponent,
    TranslocoDirective,
    AsyncPipe,
    LetDirective,
    NzTypographyComponent,
    SearchClientPortfolioDialogComponent,
    NzIconDirective
  ],
  templateUrl: './select-client-portfolio-btn.component.html',
  styleUrl: './select-client-portfolio-btn.component.less'
})
export class SelectClientPortfolioBtnComponent implements OnInit, OnDestroy {
  readonly selectedPortfolio$ = new BehaviorSubject<PortfolioKey | null>(null);

  isSearchDialogVisible = false;

  ngOnDestroy(): void {
    this.selectedPortfolio$.complete();
  }

  ngOnInit(): void {
    this.isSearchDialogVisible = true;
  }

  selectClientPortfolio(portfolio: PortfolioKey): void {
    this.selectedPortfolio$.next(portfolio);
  }
}
