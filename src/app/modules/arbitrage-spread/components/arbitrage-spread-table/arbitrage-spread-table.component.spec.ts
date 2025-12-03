import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ArbitrageSpreadTableComponent } from './arbitrage-spread-table.component';
import { ArbitrageSpreadService } from "../../services/arbitrage-spread.service";
import { of } from "rxjs";
import { TranslocoTestsModule } from "../../../../shared/utils/testing/translocoTestsModule";
import { commonTestProviders } from "../../../../shared/utils/testing/common-test-providers";
import { NzTableModule } from "ng-zorro-antd/table";
import { NzEmptyModule } from "ng-zorro-antd/empty";
import { NzTooltipModule } from "ng-zorro-antd/tooltip";

describe('ArbitrageSpreadTableComponent', () => {
  let component: ArbitrageSpreadTableComponent;
  let fixture: ComponentFixture<ArbitrageSpreadTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ArbitrageSpreadTableComponent],
      imports: [
        TranslocoTestsModule.getModule(),
        NzTableModule,
        NzEmptyModule,
        NzTooltipModule
      ],
      providers: [
        {
          provide: ArbitrageSpreadService,
          useValue: {
            getSpreadsSubscription: jasmine.createSpy('getSpreadsSubscription').and.returnValue(of([])),
            removeSpread: jasmine.createSpy('removeSpread').and.callThrough(),
            buySpread: jasmine.createSpy('buySpread').and.returnValue({}),
          }
        },
        ...commonTestProviders
  ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ArbitrageSpreadTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
