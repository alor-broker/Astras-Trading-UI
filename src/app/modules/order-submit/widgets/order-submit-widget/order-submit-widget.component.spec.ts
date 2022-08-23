import {
  ComponentFixture,
  TestBed
} from '@angular/core/testing';

import { OrderSubmitWidgetComponent } from './order-submit-widget.component';
import {
  mockComponent,
  sharedModuleImportForTests
} from '../../../../shared/utils/testing';
import { OrderSubmitModule } from '../../order-submit.module';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

describe('OrderSubmitWidgetComponent', () => {
  let component: OrderSubmitWidgetComponent;
  let fixture: ComponentFixture<OrderSubmitWidgetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        OrderSubmitModule,
        ...sharedModuleImportForTests,
        BrowserAnimationsModule
      ],
      declarations: [
        mockComponent({
          selector: 'ats-order-submit',
          inputs: ['guid']
        }),
        mockComponent({
          selector: 'ats-order-submit-settings',
          inputs: ['guid']
        })
      ]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(OrderSubmitWidgetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
