import {
  ComponentFixture,
  TestBed
} from '@angular/core/testing';

import { WidgetSettingsComponent } from './widget-settings.component';
import { DeviceService } from "../../services/device.service";
import { BehaviorSubject } from "rxjs";
import { TranslocoTestsModule } from "../../utils/testing/translocoTestsModule";

describe('WidgetSettingsComponent', () => {
  let component: WidgetSettingsComponent;
  let fixture: ComponentFixture<WidgetSettingsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        TranslocoTestsModule.getModule(),
        WidgetSettingsComponent
      ],
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
    fixture.componentRef.setInput(
      'canSave',
      true
    );
    fixture.componentRef.setInput(
      'canCopy',
      true
    );
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
