import {ComponentFixture, TestBed} from '@angular/core/testing';

import {BadgesSettingsComponent} from './badges-settings.component';
import {TranslocoTestsModule} from "../../../../shared/utils/testing/translocoTestsModule";
import {commonTestProviders} from "../../../../shared/utils/testing/common-test-providers";
import {FormsTesting} from "../../../../shared/utils/testing/forms-testing";
import {NzColorBlockComponent, NzColorPickerComponent} from "ng-zorro-antd/color-picker";
import {MockComponents, MockDirectives} from "ng-mocks";
import {NzButtonComponent} from "ng-zorro-antd/button";
import {NzFormItemComponent} from "ng-zorro-antd/form";
import {NzCollapseComponent, NzCollapsePanelComponent} from "ng-zorro-antd/collapse";
import {NzIconDirective} from "ng-zorro-antd/icon";
import {provideNoopAnimations} from "@angular/platform-browser/animations";
import {NzWaveDirective} from "ng-zorro-antd/core/wave";

describe('BadgesSettingsComponent', () => {
  let component: BadgesSettingsComponent;
  let fixture: ComponentFixture<BadgesSettingsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        BadgesSettingsComponent,
        TranslocoTestsModule.getModule(),
        ...FormsTesting.getMocks(),
        MockComponents(
          NzButtonComponent,
          NzFormItemComponent,
          NzCollapseComponent,
          NzCollapsePanelComponent,
          NzColorBlockComponent,
          NzColorPickerComponent
        ),
        MockDirectives(
          NzIconDirective,
          NzWaveDirective
        )
      ],
      providers: [
        provideNoopAnimations(),
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
