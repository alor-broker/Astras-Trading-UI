import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EvaluationService } from '../../services/evaluation.service';

import { EvaluationComponent } from './evaluation.component';

describe('EvaluationComponent', () => {
  let component: EvaluationComponent;
  let fixture: ComponentFixture<EvaluationComponent>;
  let spy = jasmine.createSpyObj('EvaluationService', ['evaluate']);

  beforeAll(() => TestBed.resetTestingModule());
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [EvaluationComponent],
      providers: [
        EvaluationComponent,
        { provide: EvaluationService, useValue: spy }
      ]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EvaluationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => fixture.destroy());

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
