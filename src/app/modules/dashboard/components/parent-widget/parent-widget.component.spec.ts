import {
  ComponentFixture,
  TestBed
} from '@angular/core/testing';

import { ParentWidgetComponent } from './parent-widget.component';
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";
import { of } from "rxjs";
import { EventEmitter } from "@angular/core";
import { mockComponent } from "../../../../shared/utils/testing";

describe('ParentWidgetComponent', () => {
  let component: ParentWidgetComponent;
  let fixture: ComponentFixture<ParentWidgetComponent>;

  beforeAll(() => TestBed.resetTestingModule());
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [
        ParentWidgetComponent,
        mockComponent({
          selector: 'ats-widget-header',
          inputs: ['guid', 'hasSettings', 'shouldShowSettings', 'hasHelp']
        })
      ],
      providers: [
        {
          provide: WidgetSettingsService,
          useValue: {
            getSettings: jasmine.createSpy('getSettings').and.returnValue(of({})),
            updateIsLinked: jasmine.createSpy('updateIsLinked').and.callThrough()
          }
        }
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ParentWidgetComponent);
    component = fixture.componentInstance;
    component.widget = {
      hasSettings: false,
      hasHelp: false,
      guid: '123',
      gridItem: { x: 0, y: 0, rows: 1, cols: 1 },
    };
    component.resize = new EventEmitter();
    fixture.detectChanges();
  });

  afterEach(() => fixture.destroy());

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
