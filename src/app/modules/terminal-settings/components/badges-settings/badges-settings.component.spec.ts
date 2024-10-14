import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BadgesSettingsComponent } from './badges-settings.component';
import { TranslocoTestsModule } from "../../../../shared/utils/testing/translocoTestsModule";
import { commonTestProviders } from "../../../../shared/utils/testing/common-test-providers";
import { FormsTesting } from "../../../../shared/utils/testing/forms-testing";
import { NzColorPickerModule } from "ng-zorro-antd/color-picker";

describe('BadgesSettingsComponent', () => {
  let component: BadgesSettingsComponent;
  let fixture: ComponentFixture<BadgesSettingsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [BadgesSettingsComponent],
      imports: [
        TranslocoTestsModule.getModule(),
        ...FormsTesting.getTestingModules(),
        NzColorPickerModule
      ],
      providers: [
        ...commonTestProviders
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BadgesSettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
