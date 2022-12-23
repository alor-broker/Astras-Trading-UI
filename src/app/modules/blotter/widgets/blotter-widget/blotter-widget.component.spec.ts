import {
  ComponentFixture,
  TestBed
} from '@angular/core/testing';
import { BlotterSettings } from 'src/app/shared/models/settings/blotter-settings.model';

import { BlotterWidgetComponent } from './blotter-widget.component';
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";
import { of } from "rxjs";
import {
  getTranslocoModule,
  mockComponent,
  ngZorroMockComponents,
  sharedModuleImportForTests
} from "../../../../shared/utils/testing";
import { Store } from "@ngrx/store";
import { EventEmitter } from '@angular/core';

const settings: BlotterSettings = {
  exchange: 'MOEX',
  portfolio: 'D39004',
  guid: '1230',
  ordersColumns: ['ticker'],
  stopOrdersColumns: ['ticker'],
  tradesColumns: ['ticker'],
  positionsColumns: ['ticker'],
  activeTabIndex: 0,
  isSoldPositionsHidden: false
};

describe('BlotterWidgetComponent', () => {
  let component: BlotterWidgetComponent;
  let fixture: ComponentFixture<BlotterWidgetComponent>;

  let widgetSettingsServiceSpy: any;

  beforeAll(() => TestBed.resetTestingModule());
  beforeEach(async () => {
    widgetSettingsServiceSpy = jasmine.createSpyObj('WidgetSettingsService', ['updateIsLinked', 'getSettings', 'updateSettings']);
    widgetSettingsServiceSpy.getSettings.and.returnValue(of({ activeTabIndex: 0 } as BlotterSettings));

    await TestBed.configureTestingModule({
      declarations: [
        BlotterWidgetComponent,
        mockComponent({selector: 'ats-positions', inputs: ['shouldShowSettings', 'guid']}),
        mockComponent({selector: 'ats-orders', inputs: ['shouldShowSettings', 'guid']}),
        mockComponent({selector: 'ats-stop-orders', inputs: ['shouldShowSettings', 'guid']}),
        mockComponent({selector: 'ats-trades', inputs: ['shouldShowSettings', 'guid']}),
        ...ngZorroMockComponents
      ],
      imports: [
        getTranslocoModule()
      ]
    }).compileComponents();

    TestBed.overrideComponent(BlotterWidgetComponent, {
      set: {
        providers: [
          { provide: WidgetSettingsService, useValue: widgetSettingsServiceSpy },
          {
            provide: Store,
            useValue: {
              select: jasmine.createSpy('select').and.returnValue(of({}))
            }
          }
        ]
      }
    });
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(BlotterWidgetComponent);
    component = fixture.componentInstance;
    component.resize = new EventEmitter();
    fixture.detectChanges();
  });

  afterEach(() => fixture.destroy());

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
