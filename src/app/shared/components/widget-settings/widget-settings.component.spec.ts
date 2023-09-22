import {
  ComponentFixture,
  TestBed
} from '@angular/core/testing';

import { WidgetSettingsComponent } from './widget-settings.component';
import { getTranslocoModule } from "../../utils/testing";
import { DeviceService } from "../../services/device.service";
import { BehaviorSubject } from "rxjs";

describe('WidgetSettingsComponent', () => {
  let component: WidgetSettingsComponent;
  let fixture: ComponentFixture<WidgetSettingsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [getTranslocoModule()],
      declarations: [WidgetSettingsComponent],
      providers: [
        {
          provide: DeviceService,
          useValue: {
            deviceInfo$: new BehaviorSubject({ isMobile: false })
          }
        }
      ]
    });
    fixture = TestBed.createComponent(WidgetSettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
