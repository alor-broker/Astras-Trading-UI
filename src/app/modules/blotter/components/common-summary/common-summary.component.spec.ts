import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { BlotterService } from '../../services/blotter.service';

import { CommonSummaryComponent } from './common-summary.component';

describe('CommonSummaryComponent', () => {
  let component: CommonSummaryComponent;
  let fixture: ComponentFixture<CommonSummaryComponent>;
  const spyBlotter = jasmine.createSpyObj('BlotterService', ['summary$', 'getSummaries']);
  spyBlotter.summary$ = of(null);
  spyBlotter.getSummaries.and.returnValue(of(null));

  beforeAll(() => TestBed.resetTestingModule());
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CommonSummaryComponent ],
      providers: [
        { provide: BlotterService, useValue: spyBlotter }
      ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CommonSummaryComponent);
    component = fixture.componentInstance;
    component.resize = jasmine.createSpyObj('resize', ['subscribe']);
    fixture.detectChanges();
  });

  afterEach(() => fixture.destroy());

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
