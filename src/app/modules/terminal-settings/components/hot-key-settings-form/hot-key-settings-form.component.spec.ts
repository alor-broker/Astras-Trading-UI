import {ComponentFixture, TestBed} from '@angular/core/testing';

import {HotKeySettingsFormComponent} from './hot-key-settings-form.component';
import {HotKeyInputComponent} from "../hot-key-input/hot-key-input.component";
import {TranslocoTestsModule} from "../../../../shared/utils/testing/translocoTestsModule";
import {commonTestProviders} from "../../../../shared/utils/testing/common-test-providers";
import {FormsTesting} from "../../../../shared/utils/testing/forms-testing";
import {NzTooltipDirective} from "ng-zorro-antd/tooltip";
import {MockComponents, MockDirectives} from "ng-mocks";
import {NzIconDirective} from "ng-zorro-antd/icon";
import {NzSwitchComponent} from "ng-zorro-antd/switch";
import {NzDividerComponent} from "ng-zorro-antd/divider";
import {NzTypographyComponent} from "ng-zorro-antd/typography";
import {NzButtonComponent} from "ng-zorro-antd/button";

describe('HotKeySettingsFormComponent', () => {
  let component: HotKeySettingsFormComponent;
  let fixture: ComponentFixture<HotKeySettingsFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        HotKeySettingsFormComponent,
        TranslocoTestsModule.getModule(),
        ...FormsTesting.getMocks(),
        MockComponents(
          NzSwitchComponent,
          NzDividerComponent,
          HotKeyInputComponent,
          NzTypographyComponent,
          NzButtonComponent
        ),
        MockDirectives(
          NzIconDirective,
          NzTooltipDirective,
        )
      ],
      providers: [
        ...commonTestProviders
      ]
    })
      .compileComponents();

    fixture = TestBed.createComponent(HotKeySettingsFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
