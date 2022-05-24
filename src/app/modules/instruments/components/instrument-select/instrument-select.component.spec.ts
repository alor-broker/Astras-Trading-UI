import { ComponentFixture, TestBed } from '@angular/core/testing';
import { InstrumentsService } from '../../services/instruments.service';
import { WatchInstrumentsService } from '../../services/watch-instruments.service';
import { InstrumentSelectComponent } from './instrument-select.component';
import { sharedModuleImportForTests } from '../../../../shared/utils/testing';

describe('InstrumentSelectComponent', () => {
  let component: InstrumentSelectComponent;
  let fixture: ComponentFixture<InstrumentSelectComponent>;
  const spyInstrs = jasmine.createSpyObj('InstrumentsService', ['getInstruments', 'unsubscribe']);
  const spyWatcher = jasmine.createSpyObj('WatchInstrumentsService', ['add', 'unsubscribe']);
  spyWatcher.add.and.returnValue();

  beforeAll(() => TestBed.resetTestingModule());
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [...sharedModuleImportForTests],
      declarations: [InstrumentSelectComponent],
      providers: [
        { provide: InstrumentsService, useValue: spyInstrs },
      ]
    }).compileComponents();

    TestBed.overrideComponent(InstrumentSelectComponent, {
      set: {
        providers: [
          { provide: WatchInstrumentsService, useValue: spyWatcher },
        ]
      }
    });
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(InstrumentSelectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => fixture?.destroy());

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
