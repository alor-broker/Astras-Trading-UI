import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AllTradesWidgetComponent } from './all-trades-widget.component';
import { AllTradesService } from "../../services/all-trades.service";

describe('AllTradesWidgetComponent', () => {
  let component: AllTradesWidgetComponent;
  let fixture: ComponentFixture<AllTradesWidgetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AllTradesWidgetComponent ],
      providers: [
        {
          provide: AllTradesService,
          useValue: {
            init: jasmine.createSpy('init').and.callThrough()
          }
        }
      ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AllTradesWidgetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
