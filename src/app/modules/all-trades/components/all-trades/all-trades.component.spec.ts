import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AllTradesComponent } from './all-trades.component';
import { AllTradesService } from "../../services/all-trades.service";
import { of } from "rxjs";
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";
import { getTranslocoModule, mockComponent } from "../../../../shared/utils/testing";

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
          inputs: ['tableContainerHeight', 'tableContainerWidth', 'data', 'isLoading', 'columns']
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
            getAllTradesSub: jasmine.createSpy('getAllTradesSub').and.returnValue(of({})),
          }
        }
      ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AllTradesComponent);
    component = fixture.componentInstance;

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
