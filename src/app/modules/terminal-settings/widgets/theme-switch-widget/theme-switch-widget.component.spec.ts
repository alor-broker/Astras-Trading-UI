import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ThemeSwitchWidgetComponent } from './theme-switch-widget.component';
import {MockDirective, MockProvider} from "ng-mocks";
import {TerminalSettingsService} from "../../../../shared/services/terminal-settings.service";
import {EMPTY} from "rxjs";
import {GlobalLoadingIndicatorService} from "../../../../shared/services/global-loading-indicator.service";
import {NzIconDirective} from "ng-zorro-antd/icon";

describe('ThemeSwitchWidgetComponent', () => {
  let component: ThemeSwitchWidgetComponent;
  let fixture: ComponentFixture<ThemeSwitchWidgetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        ThemeSwitchWidgetComponent,
        MockDirective(NzIconDirective)
      ],
      providers: [
        MockProvider(
          TerminalSettingsService,
          {
            getSettings: () => EMPTY
          }
        ),
        MockProvider(GlobalLoadingIndicatorService)
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ThemeSwitchWidgetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
