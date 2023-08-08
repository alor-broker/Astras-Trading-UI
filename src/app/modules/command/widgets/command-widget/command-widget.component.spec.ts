import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ModalService } from 'src/app/shared/services/modal.service';

import { CommandWidgetComponent } from './command-widget.component';
import { Instrument } from '../../../../shared/models/instruments/instrument.model';
import { InstrumentsService } from '../../../instruments/services/instruments.service';
import {getTranslocoModule, mockComponent} from "../../../../shared/utils/testing";
import { PortfolioSubscriptionsService } from "../../../../shared/services/portfolio-subscriptions.service";
import { DashboardContextService } from "../../../../shared/services/dashboard-context.service";

describe('CommandWidgetComponent', () => {
  let component: CommandWidgetComponent;
  let fixture: ComponentFixture<CommandWidgetComponent>;

  const modalSpy = jasmine.createSpyObj('ModalService', ['commandParams$']);
  modalSpy.commandParams$ = of();

  const instrumentServiceSpy = jasmine.createSpyObj('InstrumentsService', ['getInstrument']);
  instrumentServiceSpy.getInstrument.and.returnValue(of({} as Instrument));

  beforeAll(() => TestBed.resetTestingModule());
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [
        CommandWidgetComponent,
        mockComponent({
          selector: 'ats-setup-instrument-notifications',
          inputs: ['instrumentKey', 'active', 'priceChanges'],
        })
      ],
      imports: [
        getTranslocoModule()
      ],
      providers: [
        { provide: ModalService, useValue: modalSpy },
        { provide: InstrumentsService, useValue: instrumentServiceSpy },
        {
          provide: PortfolioSubscriptionsService,
          useValue: {
            getAllPositionsSubscription: jasmine.createSpy('getAllPositionsSubscription').and.returnValue(of({}))
          }
        },
        {
          provide: DashboardContextService,
          useValue: {
            selectedPortfolio$: jasmine.createSpy('selectedPortfolio$').and.returnValue(of([]))
          }
        }
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CommandWidgetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => fixture.destroy());

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
