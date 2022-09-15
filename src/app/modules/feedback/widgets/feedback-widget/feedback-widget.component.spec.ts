import {
  ComponentFixture,
  TestBed
} from '@angular/core/testing';
import { FeedbackWidgetComponent } from './feedback-widget.component';
import { FeedbackService } from '../../services/feedback.service';
import { of } from 'rxjs';
import { ModalService } from '../../../../shared/services/modal.service';
import { NewFeedback } from '../../models/feedback.model';


describe('FeedbackWidgetComponent', () => {
  let component: FeedbackWidgetComponent;
  let fixture: ComponentFixture<FeedbackWidgetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [FeedbackWidgetComponent],
      providers: [
        {
          provide: FeedbackService,
          useValue: {
            submitFeedback: jasmine.createSpy('submitFeedback').and.returnValue(of({}))
          }
        },
        {
          provide: ModalService,
          useValue: {
            shouldShowVoteModal$: of(true),
            voteParams$: of({ feedbackCode: 'testCode', description: '' } as NewFeedback),
            closeVoteModal: jasmine.createSpy('closeVoteModal').and.callThrough()
          }
        }
      ]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FeedbackWidgetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
