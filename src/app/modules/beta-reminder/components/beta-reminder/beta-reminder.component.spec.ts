import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BetaReminderComponent } from './beta-reminder.component';

describe('BetaReminderComponent', () => {
  let component: BetaReminderComponent;
  let fixture: ComponentFixture<BetaReminderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ BetaReminderComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(BetaReminderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
