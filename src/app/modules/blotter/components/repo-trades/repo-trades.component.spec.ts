import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RepoTradesComponent } from './repo-trades.component';
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";
import { of } from "rxjs";
import { BlotterService } from "../../services/blotter.service";
import { MockServiceBlotter } from "../../utils/mock-blotter-service";
import { TimezoneConverterService } from "../../../../shared/services/timezone-converter.service";
import { TranslatorService } from "../../../../shared/services/translator.service";
import {
  getTranslocoModule,
  mockComponent,
  ngZorroMockComponents
} from "../../../../shared/utils/testing";
import { LetDirective } from "@ngrx/component";

describe('RepoTradesComponent', () => {
  let component: RepoTradesComponent;
  let fixture: ComponentFixture<RepoTradesComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        getTranslocoModule(),
        LetDirective
      ],
      declarations: [
        RepoTradesComponent,
        ...ngZorroMockComponents,
        mockComponent({ selector: 'ats-table-filter', inputs: ['columns'] }),
        mockComponent({ selector: 'nz-filter-trigger', inputs: ['nzActive', 'nzDropdownMenu', 'nzVisible'] })
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
