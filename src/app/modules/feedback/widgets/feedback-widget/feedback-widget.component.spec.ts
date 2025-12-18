import {ComponentFixture, TestBed} from '@angular/core/testing';
import {FeedbackWidgetComponent} from './feedback-widget.component';
import {FeedbackService} from '../../services/feedback.service';
import {of} from 'rxjs';
import {ModalService} from '../../../../shared/services/modal.service';
import {NewFeedback} from '../../models/feedback.model';
import {NzNotificationService} from 'ng-zorro-antd/notification';
import ruFeedback from '../../../../../assets/i18n/feedback/ru.json';
import {TranslocoTestsModule} from "../../../../shared/utils/testing/translocoTestsModule";
import {FormsTesting} from "../../../../shared/utils/testing/forms-testing";
import {MockComponents} from "ng-mocks";
import {NzTextareaCountComponent} from "ng-zorro-antd/input";
import {NzRateComponent} from "ng-zorro-antd/rate";

describe('FeedbackWidgetComponent', () => {
  let component: FeedbackWidgetComponent;
  let fixture: ComponentFixture<FeedbackWidgetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        TranslocoTestsModule.getModule({
          langs: {
            'feedback/ru': ruFeedback,
          }
        }),
        FeedbackWidgetComponent,
        ...FormsTesting.getMocks(),
        MockComponents(
          NzRateComponent,
          NzTextareaCountComponent
        )
      ],
      providers: [
        {
          provide: FeedbackService,
          useValue: {
            submitFeedback: jasmine.createSpy('submitFeedback').and.returnValue(of({})),
            unansweredFeedbackRemoved$: of({})
          }
        },
        {
          provide: ModalService,
          useValue: {
            shouldShowVoteModal$: of(true),
            voteParams$: of({code: 'testCode', description: ''} as NewFeedback),
            closeVoteModal: jasmine.createSpy('closeVoteModal').and.callThrough()
          }
        },
        {
          provide: NzNotificationService,
          useValue: {
            success: jasmine.createSpy('success').and.callThrough()
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
