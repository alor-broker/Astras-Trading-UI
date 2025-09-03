import {Component, DestroyRef, OnChanges, SimpleChanges} from '@angular/core';
import {PropertyEditorBaseComponent} from "../property-editor-base";
import {PortfolioPropertyEditorConfig} from "../../../models/property-editor.model";
import {
  Observable,
  queueScheduler,
  subscribeOn,
  take
} from "rxjs";
import {PortfolioExtended} from "../../../../../shared/models/user/portfolio-extended.model";
import {filter, map} from "rxjs/operators";
import {groupPortfoliosByAgreement} from "../../../../../shared/utils/portfolios";
import {FormBuilder, ReactiveFormsModule, Validators} from "@angular/forms";
import {Portfolio} from "../../../graph/slot-types";
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";
import {NzFormControlComponent, NzFormDirective, NzFormItemComponent, NzFormLabelComponent} from "ng-zorro-antd/form";
import {TranslocoDirective} from "@jsverse/transloco";
import {AsyncPipe, NgForOf, NgIf} from "@angular/common";
import {NzOptionComponent, NzOptionGroupComponent, NzSelectComponent} from "ng-zorro-antd/select";
import {UserPortfoliosService} from "../../../../../shared/services/user-portfolios.service";
import { StringHelper } from "../../../../../shared/utils/string-helper";
import { MarketType } from "../../../../../shared/models/portfolio-key.model";

@Component({
    selector: 'ats-portfolio-property-editor',
    imports: [
        NzFormControlComponent,
        NzFormDirective,
        NzFormItemComponent,
        NzFormLabelComponent,
        ReactiveFormsModule,
        TranslocoDirective,
        AsyncPipe,
        NgForOf,
        NgIf,
        NzOptionComponent,
        NzOptionGroupComponent,
        NzSelectComponent
    ],
    templateUrl: './portfolio-property-editor.component.html',
    styleUrl: './portfolio-property-editor.component.less'
})
export class PortfolioPropertyEditorComponent extends PropertyEditorBaseComponent<PortfolioPropertyEditorConfig> implements OnChanges {
  private readonly separator = ':';
  protected availablePortfolios$!: Observable<Map<string, PortfolioExtended[]>>;

  protected readonly form = this.formBuilder.group({
    property: this.formBuilder.control<string | null>(null)
  });

  constructor(
    private readonly userPortfoliosService: UserPortfoliosService,
    private readonly formBuilder: FormBuilder,
    private readonly destroyRef: DestroyRef) {
    super();
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.availablePortfolios$ ??= this.userPortfoliosService.getPortfolios().pipe(
      map(portfolios => groupPortfoliosByAgreement(portfolios))
    );

    if (changes?.config.currentValue != null || changes.config.firstChange) {
      const config = this.getTypedConfig();

      if (config.validation.required) {
        this.form.controls.property.addValidators([
          Validators.required
        ]);
      }

      if (config.initialValue != null
        && !StringHelper.isNullOrEmpty(config.initialValue.agreement)
        && !StringHelper.isNullOrEmpty(config.initialValue.portfolio)
        ) {
        this.availablePortfolios$.pipe(
          take(1),
          subscribeOn(queueScheduler)
        ).subscribe(allPortfolios => {
          const target = allPortfolios.get(config.initialValue!.agreement)
            ?.find(p => p.portfolio === config.initialValue!.portfolio);

          if(target != null) {
            this.form.controls.property.setValue(this.portfolioToStr(target));
          }
        });
      }

      this.form.controls.property.valueChanges.pipe(
        filter(() => this.form.controls.property.valid),
        takeUntilDestroyed(this.destroyRef)
      ).subscribe(value => {
        if(value == null) {
          config.applyValueCallback(null);
        } else {
          config.applyValueCallback(this.strToPortfolio(value));
        }
      });
    }
  }

  protected portfolioToStr(portfolio: PortfolioExtended): string {
    return [
      portfolio.portfolio,
      portfolio.exchange,
      portfolio.agreement,
      portfolio.marketType ?? ''
    ].join(this.separator);
  }

  private strToPortfolio(value: string): Portfolio {
    const parts = value.split(this.separator);
    return {
      portfolio: parts[0],
      exchange: parts[1],
      agreement: parts[2],
      market: parts[3] as (MarketType | null)
    };
  }
}
