import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BetaReminderComponent } from './beta-reminder.component';
import { of } from 'rxjs';
import { ClientService } from '../../../../shared/services/client.service';

describe('BetaReminderComponent', () => {
  let component: BetaReminderComponent;
  let fixture: ComponentFixture<BetaReminderComponent>;
  const clientServiceSpy = jasmine.createSpyObj('ClientService', ['getFullName']);
  clientServiceSpy.getFullName.and.returnValue(of({}));

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [BetaReminderComponent],
      providers: [
        { provide: ClientService, useValue: clientServiceSpy }
      ]
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
