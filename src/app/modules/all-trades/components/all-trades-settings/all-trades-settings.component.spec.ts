import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AllTradesSettingsComponent } from './all-trades-settings.component';
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { ReactiveFormsModule } from "@angular/forms";
import { NzSelectModule } from "ng-zorro-antd/select";
import { NzFormModule } from "ng-zorro-antd/form";
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";
import { of } from "rxjs";

describe('AllTradesSettingsComponent', () => {
  let component: AllTradesSettingsComponent;
  let fixture: ComponentFixture<AllTradesSettingsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AllTradesSettingsComponent ],
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

    fixture = TestBed.createComponent(AllTradesSettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
