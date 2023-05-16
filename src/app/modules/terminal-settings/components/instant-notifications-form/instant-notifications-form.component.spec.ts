import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InstantNotificationsFormComponent } from './instant-notifications-form.component';
import {
  getTranslocoModule,
  ngZorroMockComponents
} from '../../../../shared/utils/testing';
import { Store } from "@ngrx/store";
import { of } from "rxjs";

describe('InstantNotificationsFormComponent', () => {
  let component: InstantNotificationsFormComponent;
  let fixture: ComponentFixture<InstantNotificationsFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [getTranslocoModule()],
      declarations: [
        InstantNotificationsFormComponent,
        ...ngZorroMockComponents
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
