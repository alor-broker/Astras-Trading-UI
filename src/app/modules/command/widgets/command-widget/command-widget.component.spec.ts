import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ModalService } from 'src/app/shared/services/modal.service';

import { CommandWidgetComponent } from './command-widget.component';
import { Instrument } from '../../../../shared/models/instruments/instrument.model';
import { InstrumentsService } from '../../../instruments/services/instruments.service';

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
      declarations: [CommandWidgetComponent],
      providers: [
        { provide: ModalService, useValue: modalSpy },
        { provide: InstrumentsService, useValue: instrumentServiceSpy }
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
