import {ComponentFixture, TestBed} from '@angular/core/testing';

import {AdminClientsSettingsComponent} from './admin-clients-settings.component';
import {MockComponents, MockDirectives, MockProvider} from "ng-mocks";
import {WidgetSettingsService} from "../../../../shared/services/widget-settings.service";
import {ManageDashboardsService} from "../../../../shared/services/manage-dashboards.service";
import {TranslocoTestsModule} from "../../../../shared/utils/testing/translocoTestsModule";
import {EMPTY} from "rxjs";
import {provideNoopAnimations} from "@angular/platform-browser/animations";
import {NzColDirective, NzRowDirective} from "ng-zorro-antd/grid";
import {NzFormControlComponent, NzFormDirective, NzFormItemComponent, NzFormLabelComponent} from "ng-zorro-antd/form";
import {NzOptionComponent, NzSelectComponent} from "ng-zorro-antd/select";
import {WidgetSettingsComponent} from "../../../../shared/components/widget-settings/widget-settings.component";
import {NzSliderComponent} from "ng-zorro-antd/slider";
import {GuidGenerator} from "../../../../shared/utils/guid";

describe('AdminClientsSettingsComponent', () => {
  let component: AdminClientsSettingsComponent;
  let fixture: ComponentFixture<AdminClientsSettingsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        AdminClientsSettingsComponent,
        TranslocoTestsModule.getModule(),
        MockComponents(
          NzFormControlComponent,
          NzFormItemComponent,
          NzFormLabelComponent,
          NzOptionComponent,
          NzSelectComponent,
          WidgetSettingsComponent,
          NzSliderComponent
        ),
        MockDirectives(
          NzColDirective,
          NzFormDirective,
          NzRowDirective
        )
      ],
      providers: [
        provideNoopAnimations(),
        MockProvider(
          WidgetSettingsService,
          {
            getSettings: () => EMPTY
          }
        ),
        MockProvider(ManageDashboardsService)
      ]
    })
      .compileComponents();

    fixture = TestBed.createComponent(AdminClientsSettingsComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('guid', GuidGenerator.newGuid());
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
