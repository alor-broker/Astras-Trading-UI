import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BuySellButtonsComponent } from './buy-sell-buttons.component';
import { TranslocoTestsModule } from "../../../../shared/utils/testing/translocoTestsModule";

describe('BuySellButtonsComponent', () => {
  let component: BuySellButtonsComponent;
  let fixture: ComponentFixture<BuySellButtonsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        TranslocoTestsModule.getModule(),
        BuySellButtonsComponent
      ]
    });
    fixture = TestBed.createComponent(BuySellButtonsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
