import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ArbitrageSpreadManageComponent } from './arbitrage-spread-manage.component';
import {UserPortfoliosService} from "../../../../shared/services/user-portfolios.service";
import {Subject} from "rxjs";
import { SpreadLegComponent } from "../spread-leg/spread-leg.component";
import { TranslocoTestsModule } from "../../../../shared/utils/testing/translocoTestsModule";
import { commonTestProviders } from "../../../../shared/utils/testing/common-test-providers";
import { FormsTesting } from "../../../../shared/utils/testing/forms-testing";
import { NzTooltipModule } from "ng-zorro-antd/tooltip";
import { NzEmptyModule } from "ng-zorro-antd/empty";
import { InstrumentSearchMockComponent } from "../../../../shared/utils/testing/instrument-search-mock-component";
import { InputNumberComponent } from "../../../../shared/components/input-number/input-number.component";

describe('ArbitrageSpreadManageComponent', () => {
  let component: ArbitrageSpreadManageComponent;
  let fixture: ComponentFixture<ArbitrageSpreadManageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [
        ArbitrageSpreadManageComponent,
        SpreadLegComponent
      ],
      imports: [
        TranslocoTestsModule.getModule(),
        ...FormsTesting.getTestingModules(),
        InstrumentSearchMockComponent,
        InputNumberComponent,
        NzTooltipModule,
        NzEmptyModule
      ],
      providers: [
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
