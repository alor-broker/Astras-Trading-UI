import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AllTradesComponent } from './all-trades.component';
import { of } from "rxjs";
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";
import { getTranslocoModule, mockComponent } from "../../../../shared/utils/testing";
import { AllTradesService } from '../../../../shared/services/all-trades.service';
import {TimezoneConverterService} from "../../../../shared/services/timezone-converter.service";
import {TimezoneConverter} from "../../../../shared/utils/timezone-converter";
import {TimezoneDisplayOption} from "../../../../shared/models/enums/timezone-display-option";

describe('AllTradesComponent', () => {
  let component: AllTradesComponent;
  let fixture: ComponentFixture<AllTradesComponent>;

  const settingsMock = {exchange: 'testEx', symbol: 'testSy'};

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        getTranslocoModule()
      ],
      declarations: [
        AllTradesComponent,
        mockComponent({
          selector: 'ats-infinite-scroll-table',
          inputs: ['tableContainerHeight', 'tableContainerWidth', 'data', 'isLoading', 'tableConfig']
        })
      ],
      providers: [
        {
          provide: WidgetSettingsService,
          useValue: {
            getSettings: jasmine.createSpy('getSettings').and.returnValue(of(settingsMock))
          }
        },
        {
          provide: AllTradesService,
          useValue: {
            getTradesList: jasmine.createSpy('getTradesList').and.returnValue(of([])),
            getNewTradesSubscription: jasmine.createSpy('getNewTradesSubscription').and.returnValue(of({})),
          }
        },
        {
          provide: TimezoneConverterService,
          useValue: {
            getConverter: jasmine.createSpy('getConverter').and.returnValue(of(new TimezoneConverter(TimezoneDisplayOption.MskTime))),
          }
        }
      ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AllTradesComponent);
    component = fixture.componentInstance;
    component.guid = 'testGuid';

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
