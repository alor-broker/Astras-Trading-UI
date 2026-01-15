import {ComponentFixture, TestBed} from '@angular/core/testing';

import {InstantNotificationsFormComponent} from './instant-notifications-form.component';
import {Store} from "@ngrx/store";
import {of} from "rxjs";
import {TranslocoTestsModule} from "../../../../shared/utils/testing/translocoTestsModule";
import {FormsTesting} from "../../../../shared/utils/testing/forms-testing";
import {MockComponents, MockDirectives} from "ng-mocks";
import {NzIconDirective} from "ng-zorro-antd/icon";
import {NzTooltipDirective} from "ng-zorro-antd/tooltip";
import {NzDividerComponent} from "ng-zorro-antd/divider";

describe('InstantNotificationsFormComponent', () => {
  let component: InstantNotificationsFormComponent;
  let fixture: ComponentFixture<InstantNotificationsFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        InstantNotificationsFormComponent,
        TranslocoTestsModule.getModule(),
        ...FormsTesting.getMocks(),
        MockComponents(
          NzDividerComponent
        ),
        MockDirectives(
          NzIconDirective,
          NzTooltipDirective,
        )
      ],
      providers: [
        {
          provide: Store,
          useValue: {
            select: jasmine.createSpy('select').and.returnValue(of({}))
          }
        }
      ]
    })
      .compileComponents();

    fixture = TestBed.createComponent(InstantNotificationsFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
