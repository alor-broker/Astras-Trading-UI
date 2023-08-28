import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ModalService } from 'src/app/shared/services/modal.service';
import { CommandsService } from '../../services/commands.service';

import { EditWidgetComponent } from './edit-widget.component';
import { Instrument } from '../../../../shared/models/instruments/instrument.model';
import { InstrumentsService } from '../../../instruments/services/instruments.service';
import { getTranslocoModule } from "../../../../shared/utils/testing";
import { PortfolioSubscriptionsService } from "../../../../shared/services/portfolio-subscriptions.service";
import { DashboardContextService } from "../../../../shared/services/dashboard-context.service";

describe('EditWidgetComponent', () => {
  let component: EditWidgetComponent;
  let fixture: ComponentFixture<EditWidgetComponent>;

  beforeAll(() => TestBed.resetTestingModule());
  beforeEach(async () => {
    const modalSpy = jasmine.createSpyObj('ModalService', ['editParams$']);
    const commandSpy = jasmine.createSpyObj('CommandsService', ['submitLimitEdit']);
    modalSpy.editParams$ = of();
    const instrumentServiceSpy = jasmine.createSpyObj('InstrumentsService', ['getInstrument']);
    instrumentServiceSpy.getInstrument.and.returnValue(of({} as Instrument));


    await TestBed.configureTestingModule({
      declarations: [EditWidgetComponent],
      imports: [
        getTranslocoModule()
      ],
      providers: [
        { provide: ModalService, useValue: modalSpy },
        { provide: CommandsService, useValue: commandSpy },
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
    fixture = TestBed.createComponent(EditWidgetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => fixture.destroy());

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
