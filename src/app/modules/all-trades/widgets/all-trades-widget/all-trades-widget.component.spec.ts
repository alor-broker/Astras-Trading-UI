import {
  ComponentFixture,
  TestBed
} from '@angular/core/testing';

import { AllTradesWidgetComponent } from './all-trades-widget.component';
import { provideHttpClientTesting } from "@angular/common/http/testing";
import {
  mockComponent,
  widgetSkeletonMock
} from "../../../../shared/utils/testing";
import { WidgetSettingsService } from '../../../../shared/services/widget-settings.service';
import { of } from 'rxjs';
import { DashboardContextService } from '../../../../shared/services/dashboard-context.service';
import {Widget} from "../../../../shared/models/dashboard/widget.model";
import {WidgetMeta} from "../../../../shared/models/widget-meta.model";
import {TerminalSettingsService} from "../../../../shared/services/terminal-settings.service";
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

describe('AllTradesWidgetComponent', () => {
  let component: AllTradesWidgetComponent;
  let fixture: ComponentFixture<AllTradesWidgetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
    declarations: [
        AllTradesWidgetComponent,
        mockComponent({
            selector: 'ats-all-trades',
            inputs: ['guid']
        }),
        mockComponent({
            selector: 'ats-all-trades-settings',
            inputs: ['guid']
        }),
        widgetSkeletonMock
    ],
    imports: [],
    providers: [
        {
            provide: WidgetSettingsService,
            useValue: {
                getSettingsOrNull: jasmine.createSpy('getSettingsOrNull').and.returnValue(of(null)),
                getSettings: jasmine.createSpy('getSettings').and.returnValue(of({})),
                addSettings: jasmine.createSpy('addSettings').and.callThrough()
            }
        },
        {
            provide: TerminalSettingsService,
            useValue: {
                terminalSettingsService: of({})
            }
        },
        {
            provide: DashboardContextService,
            useValue: {
                instrumentsSelection$: of({})
            }
        },
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting()
    ]
})
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AllTradesWidgetComponent);
    component = fixture.componentInstance;

    component.widgetInstance = {
      instance: {
        guid: 'guid'
      } as Widget,
      widgetMeta: {} as WidgetMeta
    };
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
