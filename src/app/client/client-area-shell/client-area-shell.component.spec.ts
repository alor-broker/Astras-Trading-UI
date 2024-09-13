import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClientAreaShellComponent } from './client-area-shell.component';
import { ClientAuthContextService } from "../services/client-auth-context.service";
import { NEVER } from "rxjs";
import { RouterModule } from "@angular/router";

describe('ClientAreaShellComponent', () => {
  let component: ClientAreaShellComponent;
  let fixture: ComponentFixture<ClientAreaShellComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports:[
        RouterModule.forChild([]),
      ],
      declarations: [ClientAreaShellComponent],
      providers: [
        {
          provide: ClientAuthContextService,
          useValue: {
            checkAccess: jasmine.createSpy('checkAccess').and.returnValue(NEVER)
          }
        }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ClientAreaShellComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
