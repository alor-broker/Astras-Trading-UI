import {
  ComponentFixture,
  TestBed
} from '@angular/core/testing';

import { AllTradesSettingsComponent } from './all-trades-settings.component';
import { ReactiveFormsModule } from "@angular/forms";
import {NzOptionComponent, NzSelectComponent} from "ng-zorro-antd/select";
import {NzFormControlComponent, NzFormItemComponent, NzFormLabelComponent} from "ng-zorro-antd/form";
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";
import { of } from "rxjs";
import { ManageDashboardsService } from "../../../../shared/services/manage-dashboards.service";
import {MockComponents} from "ng-mocks";
import {WidgetSettingsComponent} from "../../../../shared/components/widget-settings/widget-settings.component";
import {NzSwitchComponent} from "ng-zorro-antd/switch";
import {GuidGenerator} from "../../../../shared/utils/guid";

describe('AllTradesSettingsComponent', () => {
  let component: AllTradesSettingsComponent;
  let fixture: ComponentFixture<AllTradesSettingsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
    imports: [
        ReactiveFormsModule,
        AllTradesSettingsComponent,
      MockComponents(
        WidgetSettingsComponent,
        NzFormItemComponent,
        NzFormControlComponent,
        NzFormLabelComponent,
        NzSelectComponent,
        NzOptionComponent,
        NzSwitchComponent
      )
    ],
    providers: [
        {
            provide: WidgetSettingsService,
            useValue: {
                getSettings: jasmine.createSpy('getSettings').and.returnValue(of({})),
                updateSettings: jasmine.createSpy('getSettings').and.callThrough()
            }
        },
        {
            provide: ManageDashboardsService,
            useValue: {
                copyWidget: jasmine.createSpy('copyWidget').and.callThrough(),
            }
        }
    ]
})
      .compileComponents();

    fixture = TestBed.createComponent(AllTradesSettingsComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('guid', GuidGenerator.newGuid());
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
