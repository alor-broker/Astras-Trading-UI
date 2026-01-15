import {ComponentFixture, TestBed} from '@angular/core/testing';

import {ArbitrageSpreadManageComponent} from './arbitrage-spread-manage.component';
import {UserPortfoliosService} from "../../../../shared/services/user-portfolios.service";
import {Subject} from "rxjs";
import {SpreadLegComponent} from "../spread-leg/spread-leg.component";
import {TranslocoTestsModule} from "../../../../shared/utils/testing/translocoTestsModule";
import {commonTestProviders} from "../../../../shared/utils/testing/common-test-providers";
import {FormsTesting} from "../../../../shared/utils/testing/forms-testing";
import {NzTooltipDirective} from "ng-zorro-antd/tooltip";
import {MockComponents, MockDirectives} from "ng-mocks";
import {NzTypographyComponent} from "ng-zorro-antd/typography";

describe('ArbitrageSpreadManageComponent', () => {
  let component: ArbitrageSpreadManageComponent;
  let fixture: ComponentFixture<ArbitrageSpreadManageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        TranslocoTestsModule.getModule(),
        ...FormsTesting.getMocks(),
        MockComponents(
          NzTypographyComponent,
          SpreadLegComponent
        ),
        MockDirectives(
          NzTooltipDirective
        ),
        ArbitrageSpreadManageComponent
      ],
      providers:
        [
          {
            provide: UserPortfoliosService,
            useValue: {
              getPortfolios: jasmine.createSpy('getPortfolios').and.returnValue(new Subject())
            }
          },
          ...commonTestProviders
        ]
    })
      .compileComponents();

    fixture = TestBed.createComponent(ArbitrageSpreadManageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
