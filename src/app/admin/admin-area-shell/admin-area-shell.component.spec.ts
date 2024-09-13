import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminAreaShellComponent } from './admin-area-shell.component';
import { RouterModule } from "@angular/router";
import { AdminAuthContextService } from "../services/auth/admin-auth-context.service";

describe('AdminAreaShellComponent', () => {
  let component: AdminAreaShellComponent;
  let fixture: ComponentFixture<AdminAreaShellComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports:[
        RouterModule.forChild([]),
      ],
      declarations: [AdminAreaShellComponent],
      providers: [
        {
          provide: AdminAuthContextService,
          useValue: {
            checkAccess: jasmine.createSpy('checkAccess').and.callThrough()
          }
        }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminAreaShellComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
