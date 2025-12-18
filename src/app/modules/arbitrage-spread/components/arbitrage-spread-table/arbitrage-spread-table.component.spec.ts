import {ComponentFixture, TestBed} from '@angular/core/testing';

import {ArbitrageSpreadTableComponent} from './arbitrage-spread-table.component';
import {ArbitrageSpreadService} from "../../services/arbitrage-spread.service";
import {of} from "rxjs";
import {TranslocoTestsModule} from "../../../../shared/utils/testing/translocoTestsModule";
import {commonTestProviders} from "../../../../shared/utils/testing/common-test-providers";
import {MockComponents} from "ng-mocks";
import {NzTableComponent, NzTbodyComponent, NzTheadComponent} from "ng-zorro-antd/table";
import {NzButtonComponent} from "ng-zorro-antd/button";
import {NzFormControlComponent, NzFormItemComponent} from "ng-zorro-antd/form";
import {InputNumberComponent} from "../../../../shared/components/input-number/input-number.component";
import {NzEmptyComponent} from "ng-zorro-antd/empty";

describe('ArbitrageSpreadTableComponent', () => {
  let component: ArbitrageSpreadTableComponent;
  let fixture: ComponentFixture<ArbitrageSpreadTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        TranslocoTestsModule.getModule(),
        ArbitrageSpreadTableComponent,
        MockComponents(
          NzTableComponent,
          NzTheadComponent,
          NzButtonComponent,
          NzTbodyComponent,
          NzFormItemComponent,
          NzFormControlComponent,
          InputNumberComponent,
          NzEmptyComponent
        )
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
