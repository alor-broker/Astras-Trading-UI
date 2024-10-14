import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TimeframesPanelComponent } from './timeframes-panel.component';
import { LetDirective } from "@ngrx/component";
import { TranslocoTestsModule } from "../../../../shared/utils/testing/translocoTestsModule";

describe('TimeframesPanelComponent', () => {
  let component: TimeframesPanelComponent;
  let fixture: ComponentFixture<TimeframesPanelComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        LetDirective,
        TranslocoTestsModule.getModule()
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
