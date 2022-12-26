import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BlotterService } from '../../services/blotter.service';
import { MockServiceBlotter } from '../../utils/mock-blotter-service';

import { PositionsComponent } from './positions.component';
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";
import { of } from "rxjs";
import { mockComponent, sharedModuleImportForTests } from "../../../../shared/utils/testing";

describe('PositionsComponent', () => {
  let component: PositionsComponent;
  let fixture: ComponentFixture<PositionsComponent>;
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
      imports: [
        ...sharedModuleImportForTests
      ],
      providers: [
        {
          provide: WidgetSettingsService,
          useValue: { getSettings: jasmine.createSpy('getSettings').and.returnValue(of(settingsMock)) }
        },
        { provide: BlotterService, useClass: MockServiceBlotter }
      ],
      declarations: [
        PositionsComponent,
        mockComponent({ selector: 'ats-table-filter', inputs: ['columns'] })
      ]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PositionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => fixture.destroy());

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
