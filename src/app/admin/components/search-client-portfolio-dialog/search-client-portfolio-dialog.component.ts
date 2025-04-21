import {
  Component,
  DestroyRef,
  EventEmitter,
  Input,
  OnInit,
  Output
} from '@angular/core';
import { TranslocoDirective } from "@jsverse/transloco";
import {
  NzModalComponent,
  NzModalContentDirective
} from "ng-zorro-antd/modal";
import { MarketService } from "../../../shared/services/market.service";
import { map } from "rxjs/operators";
import {
  NzFormControlComponent,
  NzFormDirective,
  NzFormItemComponent
} from "ng-zorro-antd/form";
import {
  asyncScheduler,
  scheduled,
  shareReplay,
  take
} from "rxjs";
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators
} from "@angular/forms";
import {
  NzOptionComponent,
  NzSelectComponent
} from "ng-zorro-antd/select";
import { AsyncPipe } from "@angular/common";
import { NzButtonComponent } from "ng-zorro-antd/button";
import { ClientPortfolioSearchService } from "../../services/portfolio/client-portfolio-search.service";
import { mapWith } from "../../../shared/utils/observable-helper";
import { PortfolioKey } from "../../../shared/models/portfolio-key.model";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { NzTypographyComponent } from "ng-zorro-antd/typography";
import { NzInputDirective } from 'ng-zorro-antd/input';

@Component({
    selector: 'ats-search-client-portfolio-dialog',
    imports: [
        TranslocoDirective,
        NzModalComponent,
        NzModalContentDirective,
        NzFormDirective,
        ReactiveFormsModule,
        NzFormItemComponent,
        NzSelectComponent,
        AsyncPipe,
        NzOptionComponent,
        NzFormControlComponent,
        NzButtonComponent,
        NzTypographyComponent,
        NzInputDirective
    ],
    templateUrl: './search-client-portfolio-dialog.component.html',
    styleUrl: './search-client-portfolio-dialog.component.less'
})
export class SearchClientPortfolioDialogComponent implements OnInit {
  @Input()
  atsVisible = false;

  @Output()
  atsVisibleChange = new EventEmitter<boolean>();

  @Output()
  selectedPortfolio = new EventEmitter<PortfolioKey>();

  allExchanges$ = this.marketService.getAllExchanges().pipe(
    map(x => x.map(i => i.exchange)),
    shareReplay(1)
  );

  readonly validationOptions = {
    portfolio: {
      minLength: 3,
      maxLength: 20
    }
  };

  readonly searchForm = this.formBuilder.group({
    exchange: this.formBuilder.nonNullable.control('', Validators.required),
    portfolio: this.formBuilder.nonNullable.control(
      '',
      [
        Validators.required,
        Validators.minLength(this.validationOptions.portfolio.minLength),
        Validators.maxLength(this.validationOptions.portfolio.maxLength)
      ])
  });

  isSearchInProgress = false;
  showAccessError = false;

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly marketService: MarketService,
    private readonly clientPortfolioSearchService: ClientPortfolioSearchService,
    private readonly destroyRef: DestroyRef
  ) {
  }

  ngOnInit(): void {
    this.searchForm.valueChanges.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(() => {
      this.showAccessError = false;
    });
  }

  close(): void {
    this.atsVisible = false;
    this.searchForm.reset();
    this.atsVisibleChange.emit(this.atsVisible);
  }

  selectPortfolio(): void {
    if (!this.searchForm.valid) {
      return;
    }

    this.isSearchInProgress = true;

    const formValue = this.searchForm.value;
    const selectedPortfolio: PortfolioKey = {
      exchange: formValue.exchange!,
      portfolio: formValue.portfolio!.toUpperCase()
    };

    scheduled([selectedPortfolio], asyncScheduler).pipe(
      mapWith(
        value => this.clientPortfolioSearchService.checkPortfolioAccess(value),
        (selectedPortfolio, hasAccess) => ({ selectedPortfolio, hasAccess })
      ),
      take(1)
    ).subscribe(x => {
      this.isSearchInProgress = false;

      if (!x.hasAccess) {
        this.showAccessError = true;
        return;
      }

      this.selectedPortfolio.emit(x.selectedPortfolio);
      this.close();
    });
  }
}
