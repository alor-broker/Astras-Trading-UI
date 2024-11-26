import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WorkingVolumesPanelComponent } from './working-volumes-panel.component';
import {
  BehaviorSubject,
  Subject
} from 'rxjs';
import { WidgetLocalStateService } from "../../../../shared/services/widget-local-state.service";
import { SCALPER_ORDERBOOK_SHARED_CONTEXT } from "../scalper-order-book/scalper-order-book.component";
import { LetDirective } from "@ngrx/component";
import { ScalperHotKeyCommandService } from "../../services/scalper-hot-key-command.service";
import { MockProvider } from "ng-mocks";
import { ScalperOrderBookSettingsWriteService } from "../../services/scalper-order-book-settings-write.service";
import { ScalperOrderBookDataContext } from "../../models/scalper-order-book-data-context.model";

describe('WorkingVolumesPanelComponent', () => {
  let component: WorkingVolumesPanelComponent;
  let fixture: ComponentFixture<WorkingVolumesPanelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports:[LetDirective],
      declarations: [WorkingVolumesPanelComponent],
      providers: [
        MockProvider(ScalperOrderBookSettingsWriteService),
        MockProvider(
          ScalperHotKeyCommandService,
          {
            commands$: new Subject()
          }
        ),
        MockProvider(
          WidgetLocalStateService,
          {
            getStateRecord: jasmine.createSpy('getStateRecord').and.returnValue(new Subject()),
            setStateRecord: jasmine.createSpy('setStateRecord').and.callThrough()
          }
        ),
        MockProvider(
          SCALPER_ORDERBOOK_SHARED_CONTEXT,
          {
            setWorkingVolume: jasmine.createSpy('setWorkingVolume').and.callThrough()
          }
        )
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WorkingVolumesPanelComponent);
    component = fixture.componentInstance;

    component.dataContext = {
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
      addLocalOrder: () => {},
      removeLocalOrder: () => {},
      destroy: () => {}
    } as ScalperOrderBookDataContext;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
