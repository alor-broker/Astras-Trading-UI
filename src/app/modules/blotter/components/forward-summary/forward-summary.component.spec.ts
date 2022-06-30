import {
  ComponentFixture,
  TestBed
} from '@angular/core/testing';

import { ForwardSummaryComponent } from './forward-summary.component';
import { of } from "rxjs";
import { BlotterService } from "../../services/blotter.service";

describe('DerivativesSummaryComponent', () => {
  let component: ForwardSummaryComponent;
  let fixture: ComponentFixture<ForwardSummaryComponent>;
  const spyBlotter = jasmine.createSpyObj('BlotterService', ['getForwardRisks']);
  spyBlotter.getForwardRisks.and.returnValue(of(null));

  beforeAll(() => TestBed.resetTestingModule());
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ForwardSummaryComponent],
      providers: [
        { provide: BlotterService, useValue: spyBlotter }
      ]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ForwardSummaryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => fixture.destroy());

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
