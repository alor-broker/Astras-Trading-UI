import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ExchangeInfo } from '../../../models/exchange-info.model';

import { InfoHeaderComponent } from './info-header.component';

describe('InfoHeaderComponent', () => {
  let component: InfoHeaderComponent;
  let fixture: ComponentFixture<InfoHeaderComponent>;
  const info: ExchangeInfo = {
    symbol: '',
    shortName: '',
    exchange: '',
    description: '',
    isin: '',
    currency: '',
    type: '',
    lotsize: 1
  };

  beforeAll(() => TestBed.resetTestingModule());
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ InfoHeaderComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(InfoHeaderComponent);
    component = fixture.componentInstance;
    component.info = info;
    fixture.detectChanges();
  });

  afterEach(() => fixture?.destroy());

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
