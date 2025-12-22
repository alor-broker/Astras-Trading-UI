import {ComponentFixture, TestBed} from '@angular/core/testing';

import {WidgetHeaderInstrumentSwitchComponent} from './widget-header-instrument-switch.component';
import {WidgetSettingsService} from "../../services/widget-settings.service";
import {Subject} from "rxjs";
import {InstrumentsService} from "../../../modules/instruments/services/instruments.service";
import {ACTIONS_CONTEXT} from "../../services/actions-context";
import {MockComponents, MockDirectives} from "ng-mocks";
import {NzPopoverDirective} from "ng-zorro-antd/popover";
import {NzButtonComponent} from "ng-zorro-antd/button";
import {NzDropdownButtonDirective, NzDropDownDirective, NzDropdownMenuComponent} from "ng-zorro-antd/dropdown";
import {NzIconDirective} from "ng-zorro-antd/icon";
import {NzMenuDirective, NzMenuItemComponent} from "ng-zorro-antd/menu";
import {NzTypographyComponent} from "ng-zorro-antd/typography";
import {InstrumentSearchComponent} from "../instrument-search/instrument-search.component";
import {GuidGenerator} from "../../utils/guid";

describe('WidgetHeaderInstrumentSwitchComponent', () => {
  let component: WidgetHeaderInstrumentSwitchComponent;
  let fixture: ComponentFixture<WidgetHeaderInstrumentSwitchComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        WidgetHeaderInstrumentSwitchComponent,
        MockComponents(
          NzButtonComponent,
          NzDropdownMenuComponent,
          NzMenuItemComponent,
          NzTypographyComponent,
          InstrumentSearchComponent,
        ),
        MockDirectives(
          NzPopoverDirective,
          NzDropdownButtonDirective,
          NzDropDownDirective,
          NzIconDirective,
          NzMenuDirective,
        )
      ],
      providers: [
        {
          provide: WidgetSettingsService,
          useValue: {
            getSettings: jasmine.createSpy('getSettings').and.returnValue(new Subject()),
            updateSettings: jasmine.createSpy('updateSettings').and.callThrough()
          }
        },
        {
          provide: InstrumentsService,
          useValue: {
            getInstrument: jasmine.createSpy('getInstrument').and.returnValue(new Subject())
          }
        },
        {
          provide: ACTIONS_CONTEXT,
          useValue: {
            instrumentSelected: jasmine.createSpy('instrumentSelected').and.callThrough()
          }
        },
      ]
    });
    fixture = TestBed.createComponent(WidgetHeaderInstrumentSwitchComponent);
    fixture.componentRef.setInput('widgetGuid', GuidGenerator.newGuid());
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
