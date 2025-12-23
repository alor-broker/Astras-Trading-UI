import {ComponentFixture, TestBed} from '@angular/core/testing';

import {BondScreenerComponent} from './bond-screener.component';
import {of, Subject} from "rxjs";
import {WidgetSettingsService} from '../../../../shared/services/widget-settings.service';
import {BondScreenerService} from "../../services/bond-screener.service";
import {ACTIONS_CONTEXT} from "../../../../shared/services/actions-context";
import {DashboardContextService} from "../../../../shared/services/dashboard-context.service";
import {TerminalSettingsService} from "../../../../shared/services/terminal-settings.service";
import {NzContextMenuService} from "ng-zorro-antd/dropdown";
import {TranslocoTestsModule} from "../../../../shared/utils/testing/translocoTestsModule";
import {MockComponents, MockDirectives} from "ng-mocks";
import {
  InfiniteScrollTableComponent
} from "../../../../shared/components/infinite-scroll-table/infinite-scroll-table.component";
import {
  AddToWatchlistMenuComponent
} from "../../../instruments/widgets/add-to-watchlist-menu/add-to-watchlist-menu.component";
import {NzResizeObserverDirective} from "ng-zorro-antd/cdk/resize-observer";
import {GuidGenerator} from "../../../../shared/utils/guid";

xdescribe('BondScreenerComponent', () => {
  let component: BondScreenerComponent;
  let fixture: ComponentFixture<BondScreenerComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        TranslocoTestsModule.getModule(),
        BondScreenerComponent,
        MockComponents(
          InfiniteScrollTableComponent,
          AddToWatchlistMenuComponent
        ),
        MockDirectives(
          NzResizeObserverDirective
        )
      ],
      providers: [
        {
          provide: WidgetSettingsService,
          useValue: {
            getSettings: jasmine.createSpy('getSettings').and.returnValue(new Subject()),
          }
        },
        {
          provide: BondScreenerService,
          useValue: {
            getBonds: jasmine.createSpy('getBonds').and.returnValue(of({}))
          }
        },
        {
          provide: ACTIONS_CONTEXT,
          useValue: {
            instrumentSelected: jasmine.createSpy('instrumentSelected').and.callThrough()
          }
        },
        {
          provide: DashboardContextService,
          useValue: {
            instrumentsSelection$: of({})
          }
        },
        {
          provide: TerminalSettingsService,
          useValue: {
            getSettings: jasmine.createSpy('getSettings').and.returnValue(of({})),
          }
        },
        {
          provide: NzContextMenuService,
          useValue: {
            collectionChanged$: new Subject(),
            create: jasmine.createSpy('create').and.callThrough(),
            close: jasmine.createSpy('close').and.callThrough()
          }
        }
      ]
    });
    fixture = TestBed.createComponent(BondScreenerComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('guid', GuidGenerator.newGuid());
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
