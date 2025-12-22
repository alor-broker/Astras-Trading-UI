import {ComponentFixture, TestBed} from '@angular/core/testing';

import {PushNotificationsComponent} from './push-notifications.component';
import {WidgetSettingsService} from "../../../../shared/services/widget-settings.service";
import {EMPTY, Observable, Subject} from "rxjs";
import {BlotterService} from "../../services/blotter.service";
import {PushNotificationsService} from "../../../push-notifications/services/push-notifications.service";
import {LetDirective} from "@ngrx/component";
import {ErrorHandlerService} from "../../../../shared/services/handle-error/error-handler.service";
import {NzContextMenuService, NzDropdownMenuComponent} from "ng-zorro-antd/dropdown";
import {TranslocoTestsModule} from "../../../../shared/utils/testing/translocoTestsModule";
import {WidgetLocalStateService} from "../../../../shared/services/widget-local-state.service";
import {MockComponents, MockDirectives} from "ng-mocks";
import {NzEmptyComponent} from "ng-zorro-antd/empty";
import {
  NzFilterTriggerComponent,
  NzTableCellDirective,
  NzTableComponent,
  NzTableVirtualScrollDirective,
  NzTbodyComponent,
  NzThAddOnComponent,
  NzTheadComponent,
  NzThMeasureDirective,
  NzTrDirective
} from "ng-zorro-antd/table";
import {
  InstrumentBadgeDisplayComponent
} from "../../../../shared/components/instrument-badge-display/instrument-badge-display.component";
import {NzButtonComponent} from "ng-zorro-antd/button";
import {
  TableSearchFilterComponent
} from "../../../../shared/components/table-search-filter/table-search-filter.component";
import {
  AddToWatchlistMenuComponent
} from "../../../instruments/widgets/add-to-watchlist-menu/add-to-watchlist-menu.component";
import {NzResizeObserverDirective} from "ng-zorro-antd/cdk/resize-observer";
import {TableRowHeightDirective} from "../../../../shared/directives/table-row-height.directive";
import {NzPopconfirmDirective} from "ng-zorro-antd/popconfirm";
import {ResizeColumnDirective} from "../../../../shared/directives/resize-column.directive";
import {NzTooltipDirective} from "ng-zorro-antd/tooltip";
import {NzIconDirective} from "ng-zorro-antd/icon";
import {GuidGenerator} from "../../../../shared/utils/guid";

describe('PushNotificationsComponent', () => {
  let component: PushNotificationsComponent;
  let fixture: ComponentFixture<PushNotificationsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        TranslocoTestsModule.getModule(),
        LetDirective,
        PushNotificationsComponent,
        MockComponents(
          NzEmptyComponent,
          NzTableComponent,
          NzTheadComponent,
          NzThAddOnComponent,
          NzFilterTriggerComponent,
          NzTbodyComponent,
          InstrumentBadgeDisplayComponent,
          NzButtonComponent,
          NzDropdownMenuComponent,
          TableSearchFilterComponent,
          AddToWatchlistMenuComponent
        ),
        MockDirectives(
          NzResizeObserverDirective,
          TableRowHeightDirective,
          NzTrDirective,
          NzTableCellDirective,
          NzThMeasureDirective,
          NzPopconfirmDirective,
          ResizeColumnDirective,
          NzTooltipDirective,
          NzIconDirective,
          NzTableVirtualScrollDirective,
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
          provide: BlotterService,
          useValue: {
            selectNewInstrument: jasmine.createSpy('selectNewInstrument').and.callThrough(),
            getPositions: jasmine.createSpy('getPositions').and.returnValue(new Subject())
          }
        },
        {
          provide: PushNotificationsService,
          useValue: {
            cancelSubscription: jasmine.createSpy('cancelSubscription').and.returnValue(new Subject()),
            subscriptionsUpdated$: new Subject(),
            getMessages: jasmine.createSpy('getMessages').and.returnValue(new Subject()),
            getCurrentSubscriptions: jasmine.createSpy('getCurrentSubscriptions').and.returnValue(new Subject()),
            getBrowserNotificationsStatus: jasmine.createSpy('getBrowserNotificationsStatus').and.returnValue(new Subject())
          }
        },
        {
          provide: ErrorHandlerService,
          useValue: {
            handleError: jasmine.createSpy('handleError').and.callThrough()
          }
        },
        {
          provide: NzContextMenuService,
          useValue: {
            create: jasmine.createSpy('create').and.callThrough(),
            close: jasmine.createSpy('close').and.callThrough()
          }
        },
        {
          provide: WidgetLocalStateService,
          useValue: {
            getStateRecord: (): Observable<never> => EMPTY,
            setStateRecord: jasmine.createSpy('setStateRecord').and.callThrough()
          }
        },
      ]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PushNotificationsComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('guid', GuidGenerator.newGuid());
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
