import {
  ComponentFixture,
  TestBed
} from '@angular/core/testing';
import { of } from 'rxjs';
import { BlotterService } from '../../services/blotter.service';

import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";
import { CommonSummaryComponent } from './common-summary.component';

describe('CommonSummaryComponent', () => {
  let component: CommonSummaryComponent;
  let fixture: ComponentFixture<CommonSummaryComponent>;
  const spyBlotter = jasmine.createSpyObj('BlotterService', ['getCommonSummary']);
  spyBlotter.getCommonSummary.and.returnValue(of(null));

  const settingsMock = {
    exchange: 'MOEX',
    portfolio: 'D39004',
    guid: '1230',
    ordersColumns: ['ticker'],
    tradesColumns: ['ticker'],
    positionsColumns: ['ticker'],
  };

  beforeAll(() => TestBed.resetTestingModule());
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CommonSummaryComponent],
      providers: [
        { provide: BlotterService, useValue: spyBlotter },
        {
          provide: WidgetSettingsService,
          useValue: { getSettings: jasmine.createSpy('getSettings').and.returnValue(of(settingsMock)) }
        }
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CommonSummaryComponent);
    component = fixture.componentInstance;
    component.resize = jasmine.createSpyObj('resize', ['subscribe']);
    fixture.detectChanges();
  });

  afterEach(() => fixture.destroy());

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
