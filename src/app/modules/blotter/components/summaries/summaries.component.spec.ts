import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { BlotterService } from '../../services/blotter.service';

import { SummariesComponent } from './summaries.component';

describe('SummariesComponent', () => {
  let component: SummariesComponent;
  let fixture: ComponentFixture<SummariesComponent>;
  const spyBlotter = jasmine.createSpyObj('BlotterService', ['summary$', 'getSummaries']);
  spyBlotter.summary$ = of(null);
  spyBlotter.getSummaries.and.returnValue(of(null));

  beforeAll(() => TestBed.resetTestingModule());
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SummariesComponent ],
      providers: [
        { provide: BlotterService, useValue: spyBlotter }
      ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SummariesComponent);
    component = fixture.componentInstance;
    component.resize = jasmine.createSpyObj('resize', ['subscribe']);
    fixture.detectChanges();
  });

  afterEach(() => fixture.destroy());

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
