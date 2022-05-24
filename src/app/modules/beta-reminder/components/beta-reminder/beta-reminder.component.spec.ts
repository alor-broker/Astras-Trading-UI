import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BetaReminderComponent } from './beta-reminder.component';
import { of } from 'rxjs';
import { AccountService } from '../../../../shared/services/account.service';

describe('BetaReminderComponent', () => {
  let component: BetaReminderComponent;
  let fixture: ComponentFixture<BetaReminderComponent>;
  const accountServiceSpy = jasmine.createSpyObj('AccountService', ['getFullName']);
  accountServiceSpy.getFullName.and.returnValue(of({}));

  beforeAll(() => TestBed.resetTestingModule());
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [BetaReminderComponent],
      providers: [
        { provide: AccountService, useValue: accountServiceSpy }
      ]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(BetaReminderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => fixture?.destroy());

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
