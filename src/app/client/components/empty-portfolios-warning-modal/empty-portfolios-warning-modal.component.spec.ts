import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmptyPortfoliosWarningModalComponent } from './empty-portfolios-warning-modal.component';
import {ModalService} from "../../../shared/services/modal.service";
import {BehaviorSubject} from "rxjs";
import {EnvironmentService} from "../../../shared/services/environment.service";
import {HelpService} from "../../../shared/services/help.service";
import {TranslocoTestsModule} from "../../../shared/utils/testing/translocoTestsModule";

describe('EmptyPortfoliosWarningModalComponent', () => {
  let component: EmptyPortfoliosWarningModalComponent;
  let fixture: ComponentFixture<EmptyPortfoliosWarningModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        EmptyPortfoliosWarningModalComponent,
        TranslocoTestsModule.getModule()
      ],
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
            getSectionHelp: jasmine.createSpy('getSectionHelp').and.returnValue('')
          }
        }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EmptyPortfoliosWarningModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
