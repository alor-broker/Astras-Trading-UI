import {ComponentFixture, TestBed} from '@angular/core/testing';

import {AllInstrumentsSettingsComponent} from './all-instruments-settings.component';
import {WidgetSettingsService} from "../../../../shared/services/widget-settings.service";
import {of} from "rxjs";
import {NzSelectModule} from "ng-zorro-antd/select";
import {NzFormModule} from "ng-zorro-antd/form";
import {ReactiveFormsModule} from "@angular/forms";
import {ManageDashboardsService} from "../../../../shared/services/manage-dashboards.service";
import {MockComponents} from "ng-mocks";
import {WidgetSettingsComponent} from "../../../../shared/components/widget-settings/widget-settings.component";
import {GuidGenerator} from "../../../../shared/utils/guid";

describe('AllInstrumentsSettingsComponent', () => {
  let component: AllInstrumentsSettingsComponent;
  let fixture: ComponentFixture<AllInstrumentsSettingsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        ReactiveFormsModule,
        NzSelectModule,
        NzFormModule,
        AllInstrumentsSettingsComponent,
        MockComponents(
          WidgetSettingsComponent
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
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AllInstrumentsSettingsComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('guid', GuidGenerator.newGuid());
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
