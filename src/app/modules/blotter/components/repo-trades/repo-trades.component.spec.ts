import {
  ComponentFixture,
  TestBed
} from '@angular/core/testing';

import { RepoTradesComponent } from './repo-trades.component';
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";
import { of } from "rxjs";
import { BlotterService } from "../../services/blotter.service";
import { MockServiceBlotter } from "../../utils/mock-blotter-service";
import { TimezoneConverterService } from "../../../../shared/services/timezone-converter.service";
import { TranslatorService } from "../../../../shared/services/translator.service";
import { LetDirective } from "@ngrx/component";
import { NzContextMenuService } from "ng-zorro-antd/dropdown";
import { TranslocoTestsModule } from "../../../../shared/utils/testing/translocoTestsModule";
import { ngZorroMockComponents } from "../../../../shared/utils/testing/ng-zorro-component-mocks";
import { ComponentHelpers } from "../../../../shared/utils/testing/component-helpers";

describe('RepoTradesComponent', () => {
  let component: RepoTradesComponent;
  let fixture: ComponentFixture<RepoTradesComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        TranslocoTestsModule.getModule(),
        LetDirective
      ],
      declarations: [
        RepoTradesComponent,
        ...ngZorroMockComponents,
        ComponentHelpers.mockComponent({ selector: 'ats-table-filter', inputs: ['columns'] }),
        ComponentHelpers.mockComponent({ selector: 'nz-filter-trigger', inputs: ['nzActive', 'nzDropdownMenu', 'nzVisible'] }),
        ComponentHelpers.mockComponent({
          selector: 'ats-add-to-watchlist-menu'
        })
      ],
      providers: [
        {
          provide: WidgetSettingsService,
          useValue: { getSettings: jasmine.createSpy('getSettings').and.returnValue(of({})) }
        },
        { provide: BlotterService, useClass: MockServiceBlotter },
        {
          provide: TimezoneConverterService,
          useValue: {
            getConverter: jasmine.createSpy('getSettings').and.returnValue(of({}))
          }
        },
        {
          provide: TranslatorService,
          useValue: {
            getTranslator: jasmine.createSpy('getTranslator').and.returnValue(of(() => ''))
          }
        },
        {
          provide: NzContextMenuService,
          useValue: {
            create: jasmine.createSpy('create').and.callThrough(),
            close: jasmine.createSpy('close').and.callThrough()
          }
        }
      ],
    });
    fixture = TestBed.createComponent(RepoTradesComponent);
    component = fixture.componentInstance;
    component.guid = 'testGuid';
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
