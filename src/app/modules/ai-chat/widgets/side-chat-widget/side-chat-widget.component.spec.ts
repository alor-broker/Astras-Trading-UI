import {ComponentFixture, TestBed} from '@angular/core/testing';

import {SideChatWidgetComponent} from './side-chat-widget.component';
import {LocalStorageService} from "../../../../shared/services/local-storage.service";
import {TranslocoTestsModule} from "../../../../shared/utils/testing/translocoTestsModule";
import {NzDrawerComponent} from "ng-zorro-antd/drawer";
import {EMPTY,} from "rxjs";
import {USER_CONTEXT} from "../../../../shared/services/auth/user-context";
import {MockComponents} from "ng-mocks";
import {AiChatComponent} from "../../components/ai-chat/ai-chat.component";
import {NzTypographyComponent} from "ng-zorro-antd/typography";
import {TermsOfUseDialogComponent} from "../../components/terms-of-use-dialog/terms-of-use-dialog.component";

describe('SideChatWidgetComponent', () => {
  let component: SideChatWidgetComponent;
  let fixture: ComponentFixture<SideChatWidgetComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        TranslocoTestsModule.getModule(),
        SideChatWidgetComponent,
        MockComponents(
          NzDrawerComponent,
          AiChatComponent,
          NzTypographyComponent,
          TermsOfUseDialogComponent
        )
      ],
      providers: [
        {
          provide: LocalStorageService,
          useValue: {
            getStringItem: jasmine.createSpy('getStringItem').and.returnValue(undefined),
            setItem: jasmine.createSpy('setItem').and.callThrough()
          }
        },
        {
          provide: USER_CONTEXT,
          useValue: {
            getUser: jasmine.createSpy('getUser').and.returnValue(EMPTY)
          }
        }
      ]
    });
    fixture = TestBed.createComponent(SideChatWidgetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
