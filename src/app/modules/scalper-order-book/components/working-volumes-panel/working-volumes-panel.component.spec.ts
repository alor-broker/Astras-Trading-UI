import {ComponentFixture, TestBed} from '@angular/core/testing';

import {WorkingVolumesPanelComponent} from './working-volumes-panel.component';
import {BehaviorSubject, Subject} from 'rxjs';
import {WidgetLocalStateService} from "../../../../shared/services/widget-local-state.service";
import {SCALPER_ORDERBOOK_SHARED_CONTEXT} from "../scalper-order-book/scalper-order-book.component";
import {LetDirective} from "@ngrx/component";
import {ScalperHotKeyCommandService} from "../../services/scalper-hot-key-command.service";
import {MockComponents, MockDirectives, MockProvider} from "ng-mocks";
import {ScalperOrderBookSettingsWriteService} from "../../services/scalper-order-book-settings-write.service";
import {ScalperOrderBookDataContext} from "../../models/scalper-order-book-data-context.model";
import {FormsTesting} from "../../../../shared/utils/testing/forms-testing";
import {NzPopconfirmDirective} from "ng-zorro-antd/popconfirm";
import {InputNumberComponent} from "../../../../shared/components/input-number/input-number.component";
import {GuidGenerator} from "../../../../shared/utils/guid";

describe('WorkingVolumesPanelComponent', () => {
  let component: WorkingVolumesPanelComponent;
  let fixture: ComponentFixture<WorkingVolumesPanelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        LetDirective,
        WorkingVolumesPanelComponent,
        ...FormsTesting.getMocks(),
        MockComponents(
          InputNumberComponent,
        ),
        MockDirectives(
          NzPopconfirmDirective
        )
      ],
      providers: [
        MockProvider(ScalperOrderBookSettingsWriteService),
        MockProvider(ScalperHotKeyCommandService, {
          commands$: new Subject()
        }),
        MockProvider(WidgetLocalStateService, {
          getStateRecord: jasmine.createSpy('getStateRecord').and.returnValue(new Subject()),
          setStateRecord: jasmine.createSpy('setStateRecord').and.callThrough()
        }),
        MockProvider(SCALPER_ORDERBOOK_SHARED_CONTEXT, {
          setWorkingVolume: jasmine.createSpy('setWorkingVolume').and.callThrough()
        })
      ]
    })
      .compileComponents();

    fixture = TestBed.createComponent(WorkingVolumesPanelComponent);
    component = fixture.componentInstance;

    fixture.componentRef.setInput(
      'dataContext',
      {
        extendedSettings$: new Subject(),
        orderBook$: new Subject(),
        position$: new Subject(),
        currentOrders$: new Subject(),
        currentPortfolio$: new Subject(),
        trades$: new Subject(),
        ownTrades$: new Subject(),
        orderBookBody$: new Subject(),
        displayRange$: new Subject(),
        workingVolume$: new Subject(),
        scaleFactor$: new BehaviorSubject(1),
        addLocalOrder: () => {
        },
        removeLocalOrder: () => {
        },
        destroy: () => {
        }
      } as ScalperOrderBookDataContext
    );

    fixture.componentRef.setInput('guid', GuidGenerator.newGuid());
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
