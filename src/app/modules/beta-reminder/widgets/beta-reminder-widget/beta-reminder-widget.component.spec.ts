import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BetaReminderWidgetComponent } from './beta-reminder-widget.component';

describe('BetaReminderWidgetComponent', () => {
  let component: BetaReminderWidgetComponent;
  let fixture: ComponentFixture<BetaReminderWidgetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ BetaReminderWidgetComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(BetaReminderWidgetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
