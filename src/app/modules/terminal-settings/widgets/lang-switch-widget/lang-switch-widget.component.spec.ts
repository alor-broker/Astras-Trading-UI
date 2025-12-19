import {
  ComponentFixture,
  TestBed
} from '@angular/core/testing';

import { LangSwitchWidgetComponent } from './lang-switch-widget.component';
import {
  MockComponents,
  MockDirectives,
  MockProvider
} from "ng-mocks";
import { NzButtonComponent } from "ng-zorro-antd/button";
import {
  NzDropDownDirective,
  NzDropdownMenuComponent
} from "ng-zorro-antd/dropdown";
import {
  NzMenuDirective,
  NzMenuItemComponent
} from "ng-zorro-antd/menu";
import { TerminalSettingsService } from "../../../../shared/services/terminal-settings.service";
import { EMPTY } from "rxjs";
import { GlobalLoadingIndicatorService } from "../../../../shared/services/global-loading-indicator.service";

describe('LangSwitchWidgetComponent', () => {
  let component: LangSwitchWidgetComponent;
  let fixture: ComponentFixture<LangSwitchWidgetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        LangSwitchWidgetComponent,
        MockComponents(
          NzButtonComponent,
          NzDropdownMenuComponent,
          NzMenuItemComponent
        ),
        MockDirectives(
          NzDropDownDirective,
          NzMenuDirective
        )
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

    fixture = TestBed.createComponent(LangSwitchWidgetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
