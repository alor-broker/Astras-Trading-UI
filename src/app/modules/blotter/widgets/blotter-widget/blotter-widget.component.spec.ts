import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { CurrencyInstrument } from 'src/app/shared/models/enums/currencies.model';
import { WidgetNames } from 'src/app/shared/models/enums/widget-names';
import { BlotterSettings } from 'src/app/shared/models/settings/blotter-settings.model';
import { SharedModule } from 'src/app/shared/shared.module';
import { BlotterService } from '../../services/blotter.service';
import { MockServiceBlotter } from '../../utils/mock-blotter-service';

import { BlotterWidgetComponent } from './blotter-widget.component';
import { StoreModule } from "@ngrx/store";

const settings : BlotterSettings = {
  exchange: 'MOEX',
  portfolio: 'D39004',
  guid: '1230',
  ordersColumns: ['ticker'],
  stopOrdersColumns: ['ticker'],
  tradesColumns: ['ticker'],
  positionsColumns: ['ticker'],
  activeTabIndex: 0,
  currency: CurrencyInstrument.RUB
};

describe('BlotterWidgetComponent', () => {
  let component: BlotterWidgetComponent;
  let fixture: ComponentFixture<BlotterWidgetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ BlotterWidgetComponent ],
      imports: [
        SharedModule,
        StoreModule.forRoot({})
      ],
      providers: [
        { provide: BlotterService, useClass: MockServiceBlotter },
      ],
    })
    .compileComponents();

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

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
