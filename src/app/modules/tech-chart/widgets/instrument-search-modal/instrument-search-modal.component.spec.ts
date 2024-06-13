import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InstrumentSearchModalComponent } from './instrument-search-modal.component';
import { InstrumentSearchService } from "../../services/instrument-search.service";
import { of } from "rxjs";
import { InstrumentsService } from "../../../instruments/services/instruments.service";
import { getTranslocoModule, ngZorroMockComponents } from "../../../../shared/utils/testing";

describe('InstrumentSearchModalComponent', () => {
  let component: InstrumentSearchModalComponent;
  let fixture: ComponentFixture<InstrumentSearchModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [
        InstrumentSearchModalComponent,
        ...ngZorroMockComponents
      ],
      imports: [ getTranslocoModule() ],
      providers: [
        {
          provide: InstrumentSearchService,
          useValue: {
            isModalOpened$: of(false),
            modalParams$: of(null),
            closeModal: jasmine.createSpy('closeModal').and.callThrough()
          }
        },
        {
          provide: InstrumentsService,
          useValue: {
            getInstruments: jasmine.createSpy('getInstruments').and.returnValue(of([]))
          }
        }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InstrumentSearchModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
