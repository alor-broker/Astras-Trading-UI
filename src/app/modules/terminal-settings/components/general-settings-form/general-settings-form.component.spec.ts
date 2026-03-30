import {ComponentFixture, TestBed} from '@angular/core/testing';

import {GeneralSettingsFormComponent} from './general-settings-form.component';
import {TranslocoTestsModule} from "../../../../shared/utils/testing/translocoTestsModule";
import {commonTestProviders} from "../../../../shared/utils/testing/common-test-providers";
import {FormsTesting} from "../../../../shared/utils/testing/forms-testing";
import {NzPopoverDirective} from "ng-zorro-antd/popover";
import {MockComponents, MockDirectives} from "ng-mocks";
import {NzTypographyComponent} from "ng-zorro-antd/typography";
import {InputNumberComponent} from "../../../../shared/components/input-number/input-number.component";
import {NzIconDirective} from "ng-zorro-antd/icon";
import {NzBadgeComponent} from "ng-zorro-antd/badge";
import {BadgesSettingsComponent} from "../badges-settings/badges-settings.component";

describe('GeneralSettingsFormComponent', () => {
  let component: GeneralSettingsFormComponent;
  let fixture: ComponentFixture<GeneralSettingsFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        GeneralSettingsFormComponent,
        TranslocoTestsModule.getModule(),
        ...FormsTesting.getMocks(),
        MockComponents(
          NzTypographyComponent,
          InputNumberComponent,
          NzBadgeComponent,
          BadgesSettingsComponent
        ),
        MockDirectives(
          NzIconDirective,
          NzPopoverDirective
        )
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
