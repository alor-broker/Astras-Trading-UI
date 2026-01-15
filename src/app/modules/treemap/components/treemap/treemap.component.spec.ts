import {
  ComponentFixture,
  TestBed
} from '@angular/core/testing';

import { TreemapComponent } from './treemap.component';
import { TreemapService } from "../../services/treemap.service";
import {
  of,
  Subject
} from "rxjs";
import { ThemeService } from "../../../../shared/services/theme.service";
import { QuotesService } from "../../../../shared/services/quotes.service";
import { TranslatorService } from "../../../../shared/services/translator.service";
import { InstrumentsService } from "../../../instruments/services/instruments.service";
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";
import { MarketService } from "../../../../shared/services/market.service";
import { ACTIONS_CONTEXT } from "../../../../shared/services/actions-context";
import {GuidGenerator} from "../../../../shared/utils/guid";

describe('TreemapComponent', () => {
  let component: TreemapComponent;
  let fixture: ComponentFixture<TreemapComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
    imports: [TreemapComponent],
    providers: [
        {
            provide: TreemapService,
            useValue: {
                getTreemap: jasmine.createSpy('getTreemap').and.returnValue(of([]))
            }
        },
        {
            provide: ThemeService,
            useValue: {
                getThemeSettings: jasmine.createSpy('getThemeSettings').and.returnValue(of({}))
            }
        },
        {
            provide: QuotesService,
            useValue: {
                getLastQuoteInfo: jasmine.createSpy('getLastQuoteInfo').and.returnValue(of({}))
            }
        },
        {
            provide: TranslatorService,
            useValue: {
                getTranslator: jasmine.createSpy('getTranslator').and.returnValue(of(() => ''))
            }
        },
        {
            provide: InstrumentsService,
            useValue: {
                getInstrument: jasmine.createSpy('getInstrument').and.returnValue(of({}))
            }
        },
        {
            provide: ACTIONS_CONTEXT,
            useValue: {
                instrumentSelected: jasmine.createSpy('instrumentSelected').and.callThrough()
            }
        },
        {
            provide: WidgetSettingsService,
            useValue: {
                getSettings: jasmine.createSpy('getSettings').and.returnValue(of({}))
            }
        },
        {
            provide: MarketService,
            useValue: {
                getMarketSettings: jasmine.createSpy('getMarketSettings').and.returnValue(new Subject())
            }
        },
    ]
})
    .compileComponents();

    fixture = TestBed.createComponent(TreemapComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('guid', GuidGenerator.newGuid());
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
