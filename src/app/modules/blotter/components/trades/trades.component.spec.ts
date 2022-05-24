import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BlotterService } from '../../services/blotter.service';
import { MockServiceBlotter } from '../../utils/mock-blotter-service';

import { TradesComponent } from './trades.component';
import { sharedModuleImportForTests } from '../../../../shared/utils/testing';

describe('TradesComponent', () => {
  let component: TradesComponent;
  let fixture: ComponentFixture<TradesComponent>;

  beforeAll(() => TestBed.resetTestingModule());
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        ...sharedModuleImportForTests
      ],
      providers: [
        { provide: BlotterService, useClass: MockServiceBlotter }
      ],
      declarations: [TradesComponent]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TradesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => fixture.destroy());

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
