import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ScalperOrderBookWidgetComponent } from './scalper-order-book-widget.component';
import { mockComponent } from "../../../../shared/utils/testing";

describe('ScalperOrderBookWidgetComponent', () => {
  let component: ScalperOrderBookWidgetComponent;
  let fixture: ComponentFixture<ScalperOrderBookWidgetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [
        ScalperOrderBookWidgetComponent,
        mockComponent({
          selector: 'ats-scalper-order-book',
          inputs: ['guid', 'shouldShowSettings']
        })
      ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ScalperOrderBookWidgetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
