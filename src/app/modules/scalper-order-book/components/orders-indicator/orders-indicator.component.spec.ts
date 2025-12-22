import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OrdersIndicatorComponent } from './orders-indicator.component';
import { TranslocoTestsModule } from "../../../../shared/utils/testing/translocoTestsModule";
import {MockDirectives} from "ng-mocks";
import {NzIconDirective} from "ng-zorro-antd/icon";
import {NzTooltipDirective} from "ng-zorro-antd/tooltip";

describe('OrdersIndicatorComponent', () => {
  let component: OrdersIndicatorComponent;
  let fixture: ComponentFixture<OrdersIndicatorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
    imports: [
      TranslocoTestsModule.getModule(),
      OrdersIndicatorComponent,
      MockDirectives(
        NzIconDirective,
        NzTooltipDirective
      )
    ]
})
    .compileComponents();

    fixture = TestBed.createComponent(OrdersIndicatorComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('direction', 'up');
    fixture.componentRef.setInput('visible', true);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
