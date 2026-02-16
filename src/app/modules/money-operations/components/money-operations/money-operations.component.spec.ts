import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MoneyOperationsComponent } from './money-operations.component';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MockComponent } from 'ng-mocks';
import { MoneyInputComponent } from '../money-input/money-input.component';
import { MoneyWithdrawalComponent } from '../money-withdrawal/money-withdrawal.component';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { TranslocoTestsModule } from "../../../../shared/utils/testing/translocoTestsModule";

describe('MoneyOperationsComponent', () => {
  let component: MoneyOperationsComponent;
  let fixture: ComponentFixture<MoneyOperationsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        MoneyOperationsComponent,
        NoopAnimationsModule,
        TranslocoTestsModule.getModule()
      ]
    })
    .overrideComponent(MoneyOperationsComponent, {
      set: {
        imports: [
          NzTabsModule,
          MockComponent(MoneyInputComponent),
          MockComponent(MoneyWithdrawalComponent)
        ]
      }
    })
    .compileComponents();

    fixture = TestBed.createComponent(MoneyOperationsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
