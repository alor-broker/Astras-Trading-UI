import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TimeframesPanelComponent } from './timeframes-panel.component';
import { LetDirective } from "@ngrx/component";
import { getTranslocoModule } from "../../../../shared/utils/testing";

describe('TimeframesPanelComponent', () => {
  let component: TimeframesPanelComponent;
  let fixture: ComponentFixture<TimeframesPanelComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        LetDirective,
        getTranslocoModule()
      ],
      declarations: [TimeframesPanelComponent]
    });
    fixture = TestBed.createComponent(TimeframesPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
