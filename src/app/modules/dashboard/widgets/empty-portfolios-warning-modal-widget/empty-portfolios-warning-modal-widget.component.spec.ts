import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmptyPortfoliosWarningModalWidgetComponent } from './empty-portfolios-warning-modal-widget.component';
import { ModalService } from "../../../../shared/services/modal.service";
import { BehaviorSubject } from "rxjs";
import { getTranslocoModule, ngZorroMockComponents } from "../../../../shared/utils/testing";

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
