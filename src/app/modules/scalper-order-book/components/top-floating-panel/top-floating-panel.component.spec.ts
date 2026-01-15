import {ComponentFixture, TestBed} from '@angular/core/testing';

import {TopFloatingPanelComponent} from './top-floating-panel.component';
import {Subject} from "rxjs";
import {QuotesService} from "../../../../shared/services/quotes.service";
import {LetDirective} from "@ngrx/component";
import {SCALPER_ORDERBOOK_SHARED_CONTEXT} from "../scalper-order-book/scalper-order-book.component";
import {TranslocoTestsModule} from "../../../../shared/utils/testing/translocoTestsModule";
import {MockDirectives, MockProvider} from "ng-mocks";
import {ScalperOrderBookDataProvider} from "../../services/scalper-order-book-data-provider.service";
import {NzTooltipDirective} from "ng-zorro-antd/tooltip";
import {GuidGenerator} from "../../../../shared/utils/guid";

describe('TopFloatingPanelComponent', () => {
  let component: TopFloatingPanelComponent;
  let fixture: ComponentFixture<TopFloatingPanelComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        TranslocoTestsModule.getModule(),
        LetDirective,
        TopFloatingPanelComponent,
        MockDirectives(
          NzTooltipDirective
        )
      ],
      providers: [
        MockProvider(ScalperOrderBookDataProvider, {
          getSettingsStream: jasmine.createSpy('getSettings').and.returnValue(new Subject())
        }),
        {
          provide: QuotesService,
          useValue: {
            getQuotes: jasmine.createSpy('getQuotes').and.returnValue(new Subject())
          }
        },
        {
          provide: SCALPER_ORDERBOOK_SHARED_CONTEXT,
          useValue: {
            scaleFactor$: new Subject()
          }
        }
      ]
    });
    fixture = TestBed.createComponent(TopFloatingPanelComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('guid', GuidGenerator.newGuid());
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
