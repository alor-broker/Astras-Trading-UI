import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ArbitrationExtensionWidgetComponent } from './arbitration-extension-widget.component';
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";
import { of } from "rxjs";
import { mockComponent, widgetSkeletonMock } from "../../../../shared/utils/testing";

describe('ArbitrationExtensionWidgetComponent', () => {
  let component: ArbitrationExtensionWidgetComponent;
  let fixture: ComponentFixture<ArbitrationExtensionWidgetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [
        ArbitrationExtensionWidgetComponent,
        mockComponent({
          selector: 'ats-arbitration-extension',
          inputs: ['guid']
        }),
        widgetSkeletonMock
      ],
      providers: [
        {
          provide: WidgetSettingsService,
          useValue: {
            getSettings: jasmine.createSpy('getSettings').and.returnValue(of({})),
            getSettingsOrNull: jasmine.createSpy('getSettingsOrNull').and.returnValue(of(null)),
          }
        }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ArbitrationExtensionWidgetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
