import {ComponentFixture, TestBed} from '@angular/core/testing';

import {RunResultsComponent} from './run-results.component';
import {TranslocoTestsModule} from "../../../../shared/utils/testing/translocoTestsModule";

describe('RunResultsComponent', () => {
  let component: RunResultsComponent;
  let fixture: ComponentFixture<RunResultsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        RunResultsComponent,
        TranslocoTestsModule.getModule(),
      ]
    })
      .compileComponents();

    fixture = TestBed.createComponent(RunResultsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
