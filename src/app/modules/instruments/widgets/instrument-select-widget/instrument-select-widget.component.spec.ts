import {ComponentFixture, TestBed} from '@angular/core/testing';

import {InstrumentSelectWidgetComponent} from './instrument-select-widget.component';
import {WidgetSettingsService} from '../../../../shared/services/widget-settings.service';
import {of} from 'rxjs';
import {Widget} from "../../../../shared/models/dashboard/widget.model";
import {WidgetMeta} from "../../../../shared/models/widget-meta.model";
import {TerminalSettingsService} from "../../../../shared/services/terminal-settings.service";
import {TranslocoTestsModule} from "../../../../shared/utils/testing/translocoTestsModule";
import {MockComponents} from "ng-mocks";
import {WidgetSkeletonComponent} from "../../../../shared/components/widget-skeleton/widget-skeleton.component";
import {WidgetHeaderComponent} from "../../../../shared/components/widget-header/widget-header.component";
import {InstrumentSelectComponent} from "../../components/instrument-select/instrument-select.component";
import {
  InstrumentSelectSettingsComponent
} from "../../components/instrument-select-settings/instrument-select-settings.component";

describe('InstrumentSelectWidgetComponent', () => {
  let component: InstrumentSelectWidgetComponent;
  let fixture: ComponentFixture<InstrumentSelectWidgetComponent>;

  beforeAll(() => TestBed.resetTestingModule());
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        TranslocoTestsModule.getModule(),
        InstrumentSelectWidgetComponent,
        MockComponents(
          WidgetSkeletonComponent,
          WidgetHeaderComponent,
          InstrumentSelectComponent,
          InstrumentSelectSettingsComponent
        )
      ],
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
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(InstrumentSelectWidgetComponent);
    component = fixture.componentInstance;

    fixture.componentRef.setInput(
      'widgetInstance',
      {
        instance: {
          guid: 'guid'
        } as Widget,
        widgetMeta: {widgetName: {}} as WidgetMeta
      }
    );

    fixture.componentRef.setInput(
      'isBlockWidget',
      false
    );

    fixture.detectChanges();
  });

  afterEach(() => fixture?.destroy());

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
