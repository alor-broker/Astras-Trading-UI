import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExternalLogoutComponent } from './external-logout.component';

describe('ExternalLogoutComponent', () => {
  let component: ExternalLogoutComponent;
  let fixture: ComponentFixture<ExternalLogoutComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ExternalLogoutComponent ]
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
