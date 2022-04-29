import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BetaReminderWidgetComponent } from './beta-reminder-widget.component';
import { ModalService } from '../../../../shared/services/modal.service';
import { of } from 'rxjs';

describe('BetaReminderWidgetComponent', () => {
  let component: BetaReminderWidgetComponent;
  let fixture: ComponentFixture<BetaReminderWidgetComponent>;
  const modalServiceSpy = jasmine.createSpyObj('ModalService', ['shouldShowBetaReminderModal$']);
  modalServiceSpy.shouldShowBetaReminderModal$ = of(false);

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [BetaReminderWidgetComponent],
      providers: [
        { provide: ModalService, useValue: modalServiceSpy }
      ]
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
