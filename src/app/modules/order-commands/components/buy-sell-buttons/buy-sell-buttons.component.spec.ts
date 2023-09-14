import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BuySellButtonsComponent } from './buy-sell-buttons.component';
import {
  getTranslocoModule,
  ngZorroMockComponents
} from "../../../../shared/utils/testing";

describe('BuySellButtonsComponent', () => {
  let component: BuySellButtonsComponent;
  let fixture: ComponentFixture<BuySellButtonsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [getTranslocoModule()],
      declarations: [
        BuySellButtonsComponent,
        ...ngZorroMockComponents
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
