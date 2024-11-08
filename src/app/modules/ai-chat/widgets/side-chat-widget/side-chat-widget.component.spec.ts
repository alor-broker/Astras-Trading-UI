import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SideChatWidgetComponent } from './side-chat-widget.component';
import { LocalStorageService } from "../../../../shared/services/local-storage.service";
import { TranslocoTestsModule } from "../../../../shared/utils/testing/translocoTestsModule";
import { ComponentHelpers } from "../../../../shared/utils/testing/component-helpers";
import { NzDrawerModule } from "ng-zorro-antd/drawer";
import {
  EMPTY,
} from "rxjs";
import { USER_CONTEXT } from "../../../../shared/services/auth/user-context";

describe('SideChatWidgetComponent', () => {
  let component: SideChatWidgetComponent;
  let fixture: ComponentFixture<SideChatWidgetComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        TranslocoTestsModule.getModule(),
        NzDrawerModule
      ],
      declarations: [
        SideChatWidgetComponent,
        ComponentHelpers.mockComponent({selector: 'ats-ai-chat', inputs: ['atsDisabled']}),
        ComponentHelpers.mockComponent({selector: 'ats-terms-of-use-dialog', inputs: ['atsVisible']}),
      ],
      providers:[
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
