import {
  ComponentFixture,
  TestBed
} from '@angular/core/testing';

import { GeneralSettingsFormComponent } from './general-settings-form.component';
import { TranslocoTestsModule } from "../../../../shared/utils/testing/translocoTestsModule";
import { commonTestProviders } from "../../../../shared/utils/testing/common-test-providers";
import { FormsTesting } from "../../../../shared/utils/testing/forms-testing";
import { NzPopoverModule } from "ng-zorro-antd/popover";

describe('GeneralSettingsFormComponent', () => {
  let component: GeneralSettingsFormComponent;
  let fixture: ComponentFixture<GeneralSettingsFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        TranslocoTestsModule.getModule(),
        ...FormsTesting.getTestingModules(),
        NzPopoverModule
      ],
      declarations: [
        GeneralSettingsFormComponent
      ],
      providers: [
        ...commonTestProviders
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GeneralSettingsFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
