import {ComponentFixture, TestBed} from '@angular/core/testing';

import {NotificationsListComponent} from './notifications-list.component';
import {NotificationsService} from "../../services/notifications.service";
import {of} from "rxjs";
import {MockComponents, MockDirectives} from "ng-mocks";
import {NzTableCellDirective, NzTableComponent, NzTbodyComponent, NzTrDirective} from "ng-zorro-antd/table";
import {TableRowHeightDirective} from "../../../../shared/directives/table-row-height.directive";
import {NzBadgeComponent} from "ng-zorro-antd/badge";
import {NzTypographyComponent} from "ng-zorro-antd/typography";

describe('NotificationsListComponent', () => {
  let component: NotificationsListComponent;
  let fixture: ComponentFixture<NotificationsListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        NotificationsListComponent,
        MockComponents(
          NzTableComponent,
          NzTbodyComponent,
          NzBadgeComponent,
          NzTypographyComponent,
        ),
        MockDirectives(
          TableRowHeightDirective,
          NzTrDirective,
          NzTableCellDirective,
        )
      ],
      providers: [
        {
          provide: NotificationsService,
          useValue: {
            getNotifications: jasmine.createSpy('getNotifications').and.returnValue(of([]))
          }
        }
      ]
    })
      .compileComponents();

    fixture = TestBed.createComponent(NotificationsListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
