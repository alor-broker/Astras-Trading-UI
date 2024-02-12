import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmptyPortfoliosWarningModalWidgetComponent } from './empty-portfolios-warning-modal-widget.component';
import { ModalService } from "../../../../shared/services/modal.service";
import { BehaviorSubject } from "rxjs";
import { getTranslocoModule, ngZorroMockComponents } from "../../../../shared/utils/testing";
import { EnvironmentService } from "../../../../shared/services/environment.service";
import { HelpService } from "../../../../shared/services/help.service";

describe('EmptyPortfoliosWarningModalWidgetComponent', () => {
  let component: EmptyPortfoliosWarningModalWidgetComponent;
  let fixture: ComponentFixture<EmptyPortfoliosWarningModalWidgetComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [
        EmptyPortfoliosWarningModalWidgetComponent,
        ...ngZorroMockComponents
      ],
      imports: [getTranslocoModule()],
      providers: [
        {
          provide: ModalService,
          useValue: {
            shouldShowEmptyPortfoliosWarningModal$: new BehaviorSubject(false),
            closeEmptyPortfoliosWarningModal: jasmine.createSpy('closeEmptyPortfoliosWarningModal').and.callThrough()
          }
        },
        {
          provide: EnvironmentService,
          useValue: {
            externalLinks: {
              support: '',
              help: ''
            }
          }
        },
        {
          provide: HelpService,
          useValue: {
            getHelpLink: jasmine.createSpy('getHelpLink').and.returnValue('')
          }
        }
      ]
    });
    fixture = TestBed.createComponent(EmptyPortfoliosWarningModalWidgetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
