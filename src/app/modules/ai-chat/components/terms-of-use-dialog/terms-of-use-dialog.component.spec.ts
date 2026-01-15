import {ComponentFixture, TestBed} from '@angular/core/testing';

import {TermsOfUseDialogComponent} from './terms-of-use-dialog.component';
import {TranslocoTestsModule} from "../../../../shared/utils/testing/translocoTestsModule";
import {MockComponents, MockDirectives, MockProvider} from "ng-mocks";
import {AiChatTermsOfUseService} from "../../services/ai-chat-terms-of-use.service";
import {EMPTY} from "rxjs";
import {NzModalComponent, NzModalContentDirective, NzModalFooterDirective} from "ng-zorro-antd/modal";
import {MarkdownComponent} from "ngx-markdown";
import {NzSpinComponent} from "ng-zorro-antd/spin";
import {NzButtonComponent} from "ng-zorro-antd/button";

describe('TermsOfUseDialogComponent', () => {
  let component: TermsOfUseDialogComponent;
  let fixture: ComponentFixture<TermsOfUseDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        TranslocoTestsModule.getModule(),
        TermsOfUseDialogComponent,
        MockComponents(
          NzModalComponent,
          MarkdownComponent,
          NzSpinComponent,
          NzButtonComponent
        ),
        MockDirectives(
          NzModalContentDirective,
          NzModalFooterDirective
        )
      ],
      providers: [
        MockProvider(AiChatTermsOfUseService, {
          getContent: () => EMPTY
        })
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
