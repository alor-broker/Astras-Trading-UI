import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OptionBoardSettingsComponent } from './option-board-settings.component';
import {getTranslocoModule, mockComponent} from "../../../../shared/utils/testing";
import {WidgetSettingsService} from "../../../../shared/services/widget-settings.service";
import {Subject} from "rxjs";

describe('OptionBoardSettingsComponent', () => {
  let component: OptionBoardSettingsComponent;
  let fixture: ComponentFixture<OptionBoardSettingsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [getTranslocoModule()],
      declarations: [
        OptionBoardSettingsComponent,
        mockComponent({ selector: 'ats-instrument-board-select', inputs: ['symbol', 'placeholder'] }),
        mockComponent({ selector: 'ats-instrument-search' })
      ],
      providers:[
        {
        provide: WidgetSettingsService,
        useValue: {
          getSettings: jasmine.createSpy('getSettings').and.returnValue(new Subject()),
          updateSettings: jasmine.createSpy('updateSettings').and.callThrough()
        }
      }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OptionBoardSettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
