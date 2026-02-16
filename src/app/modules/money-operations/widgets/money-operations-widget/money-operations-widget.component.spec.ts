import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MoneyOperationsWidgetComponent } from './money-operations-widget.component';
import { WidgetInstance } from '../../../../shared/models/dashboard/dashboard-item.model';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MockComponent } from 'ng-mocks';
import { MoneyOperationsComponent } from '../../components/money-operations/money-operations.component';
import { TranslocoTestsModule } from "../../../../shared/utils/testing/translocoTestsModule";

describe('MoneyOperationsWidgetComponent', () => {
  let component: MoneyOperationsWidgetComponent;
  let fixture: ComponentFixture<MoneyOperationsWidgetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        MoneyOperationsWidgetComponent,
        NoopAnimationsModule,
        TranslocoTestsModule.getModule()
      ]
    })
    .overrideComponent(MoneyOperationsWidgetComponent, {
      set: {
        imports: [
          MockComponent(MoneyOperationsComponent)
        ]
      }
    })
    .compileComponents();

    fixture = TestBed.createComponent(MoneyOperationsWidgetComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('widgetInstance', {
      instance: {
        guid: '123'
      }
    } as WidgetInstance);
    fixture.componentRef.setInput('isBlockWidget', false);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
