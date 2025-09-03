import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CurrentTimeComponent } from './current-time.component';
import { MockProvider } from "ng-mocks";
import { TerminalSettingsService } from "../../../shared/services/terminal-settings.service";
import { EMPTY } from 'rxjs';

describe('CurrentTimeComponent', () => {
  let component: CurrentTimeComponent;
  let fixture: ComponentFixture<CurrentTimeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CurrentTimeComponent],
      providers: [
        MockProvider(
          TerminalSettingsService,
          {
            getSettings: () => EMPTY
          }
        )
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CurrentTimeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
