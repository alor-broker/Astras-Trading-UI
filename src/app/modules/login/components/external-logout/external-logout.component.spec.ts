import {
  ComponentFixture,
  TestBed
} from '@angular/core/testing';

import { ExternalLogoutComponent } from './external-logout.component';
import { LocalStorageService } from "../../../../shared/services/local-storage.service";

describe('ExternalLogoutComponent', () => {
  let component: ExternalLogoutComponent;
  let fixture: ComponentFixture<ExternalLogoutComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ExternalLogoutComponent],
      providers: [
        {
          provide: LocalStorageService,
          useValue: {
            removeItem: jasmine.createSpy('removeItem').and.callThrough()
          }
        }
      ]
    })
      .compileComponents();

    fixture = TestBed.createComponent(ExternalLogoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
