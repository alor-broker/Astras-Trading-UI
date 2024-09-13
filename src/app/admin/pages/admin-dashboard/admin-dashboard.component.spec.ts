import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminDashboardComponent } from './admin-dashboard.component';
import { USER_CONTEXT } from "../../../shared/services/auth/user-context";
import { NEVER } from "rxjs";

describe('AdminDashboardComponent', () => {
  let component: AdminDashboardComponent;
  let fixture: ComponentFixture<AdminDashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminDashboardComponent],
      providers:[
        {
          provide: USER_CONTEXT,
          useValue: {
            getUser: jasmine.createSpy('getUser').and.returnValue(NEVER)
          }
        }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
