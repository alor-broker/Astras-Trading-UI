import {Component, DestroyRef, OnChanges, OnInit, SimpleChanges} from '@angular/core';
import {PropertyEditorBaseComponent} from "../property-editor-base";
import {PortfolioPropertyEditorConfig} from "../../../models/property-editor.model";
import {Observable} from "rxjs";
import {PortfolioExtended} from "../../../../../shared/models/user/portfolio-extended.model";
import {filter, map} from "rxjs/operators";
import {groupPortfoliosByAgreement} from "../../../../../shared/utils/portfolios";
import {FormBuilder, ReactiveFormsModule, Validators} from "@angular/forms";
import {PortfolioKey} from "../../../graph/slot-types";
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";
import {NzFormControlComponent, NzFormDirective, NzFormItemComponent, NzFormLabelComponent} from "ng-zorro-antd/form";
import {TranslocoDirective} from "@jsverse/transloco";
import {AsyncPipe, NgForOf, NgIf} from "@angular/common";
import {NzOptionComponent, NzOptionGroupComponent, NzSelectComponent} from "ng-zorro-antd/select";
import {UserPortfoliosService} from "../../../../../shared/services/user-portfolios.service";

@Component({
  selector: 'ats-portfolio-property-editor',
  standalone: true,
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
export class PortfolioPropertyEditorComponent extends PropertyEditorBaseComponent<PortfolioPropertyEditorConfig> implements OnInit, OnChanges {
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
    if (changes?.config.currentValue != null || changes.config.firstChange) {
      const config = this.getTypedConfig();

      if (config.validation.required) {
        this.form.controls.property.addValidators([
          Validators.required
        ]);
      }

      if (config.initialValue != null) {
        this.form.controls.property.setValue(this.portfolioToStr(config.initialValue));
      }

      this.form.controls.property.valueChanges.pipe(
        filter(() => this.form.controls.property.valid),
        takeUntilDestroyed(this.destroyRef)
      ).subscribe(value => {
        config.applyValueCallback(this.strToPortfolio(value!));
      });
    }
  }

  ngOnInit(): void {
    this.availablePortfolios$ = this.userPortfoliosService.getPortfolios().pipe(
      map(portfolios => groupPortfoliosByAgreement(portfolios))
    );
  }

  protected portfolioToStr(portfolio: PortfolioKey): string {
    return [
      portfolio.portfolio,
      portfolio.exchange
    ].join(":");
  }

  private strToPortfolio(value: string): PortfolioKey {
    const parts = value.split(":");
    return {
      portfolio: parts[0],
      exchange: parts[1]
    };
  }
}
