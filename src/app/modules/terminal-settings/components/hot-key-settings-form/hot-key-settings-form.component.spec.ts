import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HotKeySettingsFormComponent } from './hot-key-settings-form.component';
import { HotKeyInputComponent } from "../hot-key-input/hot-key-input.component";
import { TranslocoTestsModule } from "../../../../shared/utils/testing/translocoTestsModule";
import { commonTestProviders } from "../../../../shared/utils/testing/common-test-providers";
import { ComponentHelpers } from "../../../../shared/utils/testing/component-helpers";
import { FormsTesting } from "../../../../shared/utils/testing/forms-testing";
import { NzTooltipModule } from "ng-zorro-antd/tooltip";

describe('HotKeySettingsFormComponent', () => {
  let component: HotKeySettingsFormComponent;
  let fixture: ComponentFixture<HotKeySettingsFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        TranslocoTestsModule.getModule(),
        ...FormsTesting.getTestingModules(),
        NzTooltipModule
      ],
      declarations: [
        HotKeySettingsFormComponent,
        ComponentHelpers.mockComponent({selector: 'nz-divider'}),
        HotKeyInputComponent
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
