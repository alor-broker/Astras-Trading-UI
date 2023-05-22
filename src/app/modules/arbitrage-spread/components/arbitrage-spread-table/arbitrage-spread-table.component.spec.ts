import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ArbitrageSpreadTableComponent } from './arbitrage-spread-table.component';
import { ArbitrageSpreadService } from "../../services/arbitrage-spread.service";
import { of } from "rxjs";
import { ModalService } from "../../../../shared/services/modal.service";
import { commonTestProviders, getTranslocoModule, sharedModuleImportForTests } from "../../../../shared/utils/testing";

describe('ArbitrageSpreadTableComponent', () => {
  let component: ArbitrageSpreadTableComponent;
  let fixture: ComponentFixture<ArbitrageSpreadTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ArbitrageSpreadTableComponent ],
      imports: [...sharedModuleImportForTests, getTranslocoModule()],
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
