import {
  ComponentFixture,
  TestBed
} from '@angular/core/testing';

import { ExternalLogoutPageComponent } from './external-logout-page.component';
import { LocalStorageService } from "../../../shared/services/local-storage.service";

describe('ExternalLogoutPageComponent', () => {
  let component: ExternalLogoutPageComponent;
  let fixture: ComponentFixture<ExternalLogoutPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ExternalLogoutPageComponent],
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

    fixture = TestBed.createComponent(ExternalLogoutPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
