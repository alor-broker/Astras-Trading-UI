import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ExchangeInfo } from '../../../models/exchange-info.model';

import { InfoHeaderComponent } from './info-header.component';
import { ngZorroMockComponents } from "../../../../../shared/utils/testing";
import { EnvironmentService } from "../../../../../shared/services/environment.service";

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
    lotsize: 1,
    priceStep: 1,
    expirationDate: null,
    cfiCode: null
  };

  beforeAll(() => TestBed.resetTestingModule());
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [
        InfoHeaderComponent,
        ...ngZorroMockComponents
      ],
      providers: [
        {
          provide: EnvironmentService,
          useValue: {
            alorIconsStorageUrl: ''
          }
        }
      ]
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
