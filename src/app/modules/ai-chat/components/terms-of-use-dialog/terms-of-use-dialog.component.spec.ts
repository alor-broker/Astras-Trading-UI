import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TermsOfUseDialogComponent } from './terms-of-use-dialog.component';
import { TranslocoTestsModule } from "../../../../shared/utils/testing/translocoTestsModule";
import { ngZorroMockComponents } from "../../../../shared/utils/testing/ng-zorro-component-mocks";
import { MockProvider } from "ng-mocks";
import { AiChatTermsOfUseService } from "../../services/ai-chat-terms-of-use.service";
import { EMPTY } from "rxjs";

describe('TermsOfUseDialogComponent', () => {
  let component: TermsOfUseDialogComponent;
  let fixture: ComponentFixture<TermsOfUseDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TranslocoTestsModule.getModule()],
      declarations:[
        TermsOfUseDialogComponent,
        ...ngZorroMockComponents
      ],
      providers:[
        MockProvider(
          AiChatTermsOfUseService,
          {
            getContent: () => EMPTY
          }
        )
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TermsOfUseDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
