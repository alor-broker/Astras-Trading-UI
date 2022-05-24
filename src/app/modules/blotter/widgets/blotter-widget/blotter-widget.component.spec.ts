import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CurrencyInstrument } from 'src/app/shared/models/enums/currencies.model';
import { BlotterSettings } from 'src/app/shared/models/settings/blotter-settings.model';
import { BlotterService } from '../../services/blotter.service';
import { MockServiceBlotter } from '../../utils/mock-blotter-service';

import { BlotterWidgetComponent } from './blotter-widget.component';

const settings: BlotterSettings = {
  exchange: 'MOEX',
  portfolio: 'D39004',
  guid: '1230',
  ordersColumns: ['ticker'],
  stopOrdersColumns: ['ticker'],
  tradesColumns: ['ticker'],
  positionsColumns: ['ticker'],
  activeTabIndex: 0,
  currency: CurrencyInstrument.RUB,
  isSoldPositionsHidden: false
};

describe('BlotterWidgetComponent', () => {
  let component: BlotterWidgetComponent;
  let fixture: ComponentFixture<BlotterWidgetComponent>;

  beforeAll(() => TestBed.resetTestingModule());
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [BlotterWidgetComponent],
      imports: []
    }).compileComponents();

    TestBed.overrideComponent(BlotterWidgetComponent, {
      set: {
        providers: [
          { provide: BlotterService, useClass: MockServiceBlotter },
        ]
      }
    });
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(BlotterWidgetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => fixture.destroy());

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
