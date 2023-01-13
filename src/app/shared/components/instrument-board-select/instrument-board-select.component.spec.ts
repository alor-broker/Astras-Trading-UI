import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InstrumentBoardSelectComponent } from './instrument-board-select.component';
import { InstrumentsService } from '../../../modules/instruments/services/instruments.service';
import { Subject } from 'rxjs';
import { mockComponent } from '../../utils/testing';

describe('InstrumentBoardSelectComponent', () => {
  let component: InstrumentBoardSelectComponent;
  let fixture: ComponentFixture<InstrumentBoardSelectComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [
        InstrumentBoardSelectComponent,
        mockComponent({ selector: 'nz-select', inputs: ['ngModel', 'nzPlaceHolder'] })
      ],
      providers: [
        {
          provide: InstrumentsService,
          useValue: {
            getInstrumentBoards: jasmine.createSpy('getInstrumentBoards').and.returnValue(new Subject())
          }
        }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InstrumentBoardSelectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
