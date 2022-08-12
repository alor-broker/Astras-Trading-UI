import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AllInstrumentsSettingsComponent } from './all-instruments-settings.component';
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";
import { of } from "rxjs";
import { NzSelectModule } from "ng-zorro-antd/select";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { NzFormModule } from "ng-zorro-antd/form";
import { ReactiveFormsModule } from "@angular/forms";

describe('AllInstrumentsSettingsComponent', () => {
  let component: AllInstrumentsSettingsComponent;
  let fixture: ComponentFixture<AllInstrumentsSettingsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [
        AllInstrumentsSettingsComponent,
      ],
      imports: [
        NoopAnimationsModule,
        ReactiveFormsModule,
        NzSelectModule,
        NzFormModule
      ],
      providers: [
        {
          provide: WidgetSettingsService,
          useValue: {
            getSettings: jasmine.createSpy('getSettings').and.returnValue(of({})),
            updateSettings: jasmine.createSpy('getSettings').and.callThrough()
          }
        }
      ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AllInstrumentsSettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
