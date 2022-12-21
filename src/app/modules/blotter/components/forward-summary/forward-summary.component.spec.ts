import {
  ComponentFixture,
  TestBed
} from '@angular/core/testing';

import { ForwardSummaryComponent } from './forward-summary.component';
import { of } from "rxjs";
import { BlotterService } from "../../services/blotter.service";
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";
import { EventEmitter } from "@angular/core";
import { TerminalSettingsService } from "../../../terminal-settings/services/terminal-settings.service";
import { getTranslocoModule } from "../../../../shared/utils/testing";

describe('ForwardSummaryComponent', () => {
  let component: ForwardSummaryComponent;
  let fixture: ComponentFixture<ForwardSummaryComponent>;
  const spyBlotter = jasmine.createSpyObj('BlotterService', ['getForwardRisks']);
  spyBlotter.getForwardRisks.and.returnValue(of(null));
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
      declarations: [ForwardSummaryComponent],
      imports: [
        getTranslocoModule()
      ],
      providers: [
        { provide: BlotterService, useValue: spyBlotter },
        {
          provide: WidgetSettingsService,
          useValue: { getSettings: jasmine.createSpy('getSettings').and.returnValue(of(settingsMock)) }
        },
        {
          provide: TerminalSettingsService,
          useValue: {
            getSettings: jasmine.createSpy('getSettings').and.returnValue(of({
              portfoliosCurrency: []
            }))
          }
        }
      ]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ForwardSummaryComponent);
    component = fixture.componentInstance;
    component.resize = new EventEmitter();
    fixture.detectChanges();
  });

  afterEach(() => fixture.destroy());

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
