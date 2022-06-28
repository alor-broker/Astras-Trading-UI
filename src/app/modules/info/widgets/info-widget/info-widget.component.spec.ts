import {
  ComponentFixture,
  TestBed
} from '@angular/core/testing';
import { InfoService } from '../../services/info.service';

import { InfoWidgetComponent } from './info-widget.component';
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";

describe('InfoWidgetComponent', () => {
  let component: InfoWidgetComponent;
  let fixture: ComponentFixture<InfoWidgetComponent>;
  const infoSpy = jasmine.createSpyObj('InfoService', ['getExchangeInfo', 'init']);
  infoSpy.getExchangeInfo.and.returnValue(null);

  beforeAll(() => TestBed.resetTestingModule());
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [InfoWidgetComponent],
    })
      .compileComponents();

    TestBed.overrideComponent(InfoWidgetComponent, {
      set: {
        providers: [
          { provide: InfoService, useValue: infoSpy },
          {
            provide: WidgetSettingsService,
            useValue: { updateSettings: jasmine.createSpy('updateSettings').and.callThrough() }
          },
        ]
      }
    });
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(InfoWidgetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => fixture?.destroy());

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
