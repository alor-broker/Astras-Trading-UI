import {ComponentFixture, TestBed} from '@angular/core/testing';

import {OrdersGroupModalWidgetComponent} from './orders-group-modal-widget.component';
import {BlotterService} from "../../services/blotter.service";
import {BehaviorSubject} from "rxjs";
import {TranslocoTestsModule} from "../../../../shared/utils/testing/translocoTestsModule";
import {MockComponents, MockDirectives} from "ng-mocks";
import {NzModalComponent, NzModalContentDirective, NzModalFooterDirective} from "ng-zorro-antd/modal";
import {OrdersGroupModalComponent} from "../../components/orders-group-modal/orders-group-modal.component";
import {NzButtonComponent} from "ng-zorro-antd/button";
import {GuidGenerator} from "../../../../shared/utils/guid";

describe('OrdersGroupModalWidgetComponent', () => {
  let component: OrdersGroupModalWidgetComponent;
  let fixture: ComponentFixture<OrdersGroupModalWidgetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        TranslocoTestsModule.getModule(),
        OrdersGroupModalWidgetComponent,
        MockComponents(
          NzModalComponent,
          OrdersGroupModalComponent,
          NzButtonComponent,
        ),
        MockDirectives(
          NzModalContentDirective,
          NzModalFooterDirective
        )
      ],
      providers: [
        {
          provide: BlotterService,
          useValue: {
            shouldShowOrderGroupModal$: new BehaviorSubject(false),
            orderGroupParams$: new BehaviorSubject(null),
            closeOrderGroupModal: jasmine.createSpy('closeOrderGroupModal').and.callThrough()
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(OrdersGroupModalWidgetComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('guid', GuidGenerator.newGuid());
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
