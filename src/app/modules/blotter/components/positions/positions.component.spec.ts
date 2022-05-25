import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BlotterService } from '../../services/blotter.service';
import { MockServiceBlotter } from '../../utils/mock-blotter-service';

import { PositionsComponent } from './positions.component';
import { sharedModuleImportForTests } from '../../../../shared/utils/testing';

describe('PositionsComponent', () => {
  let component: PositionsComponent;
  let fixture: ComponentFixture<PositionsComponent>;

  beforeAll(() => TestBed.resetTestingModule());
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        ...sharedModuleImportForTests
      ],
      providers: [
        { provide: BlotterService, useClass: MockServiceBlotter }
      ],
      declarations: [PositionsComponent]
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
