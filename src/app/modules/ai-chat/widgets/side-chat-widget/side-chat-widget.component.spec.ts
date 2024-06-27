import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SideChatWidgetComponent } from './side-chat-widget.component';
import {
  getTranslocoModule,
  mockComponent,
  ngZorroMockComponents
} from "../../../../shared/utils/testing";
import { LocalStorageService } from "../../../../shared/services/local-storage.service";
import { AuthService } from "../../../../shared/services/auth.service";
import { Subject } from "rxjs";

describe('SideChatWidgetComponent', () => {
  let component: SideChatWidgetComponent;
  let fixture: ComponentFixture<SideChatWidgetComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [getTranslocoModule()],
      declarations: [
        SideChatWidgetComponent,
        mockComponent({selector: 'ats-ai-chat'}),
        mockComponent({selector: 'ats-terms-of-use-dialog', inputs: ['atsVisible']}),
        ...ngZorroMockComponents
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
          provide: AuthService,
          useValue: {
            currentUser$: new Subject()
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
