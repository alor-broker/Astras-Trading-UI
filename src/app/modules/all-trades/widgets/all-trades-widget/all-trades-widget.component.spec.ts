import {
  ComponentFixture,
  TestBed
} from '@angular/core/testing';

import { AllTradesWidgetComponent } from './all-trades-widget.component';
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { mockComponent } from "../../../../shared/utils/testing";
import { EventEmitter } from "@angular/core";

describe('AllTradesWidgetComponent', () => {
  let component: AllTradesWidgetComponent;
  let fixture: ComponentFixture<AllTradesWidgetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [
        AllTradesWidgetComponent,
        mockComponent({
          selector: 'ats-all-trades',
          inputs: ['guid', 'contentSize']
        })
      ],
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AllTradesWidgetComponent);
    component = fixture.componentInstance;
    component.resize = new EventEmitter();
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
