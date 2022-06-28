import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { BlotterService } from '../../services/blotter.service';

import { SummariesComponent } from './summaries.component';
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";

describe('SummariesComponent', () => {
  let component: SummariesComponent;
  let fixture: ComponentFixture<SummariesComponent>;
  const spyBlotter = jasmine.createSpyObj('BlotterService', ['summary$', 'getSummaries']);
  spyBlotter.summary$ = of(null);
  spyBlotter.getSummaries.and.returnValue(of(null));
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
      declarations: [ SummariesComponent ],
      providers: [
        { provide: BlotterService, useValue: spyBlotter },
        {
          provide: WidgetSettingsService,
          useValue: { getSettings: jasmine.createSpy('getSettings').and.returnValue(of(settingsMock)) }
        }
      ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SummariesComponent);
    component = fixture.componentInstance;
    component.resize = jasmine.createSpyObj('resize', ['subscribe']);
    fixture.detectChanges();
  });

  afterEach(() => fixture.destroy());

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
