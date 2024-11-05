import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DesktopNavbarComponent } from './desktop-navbar.component';
import {MockComponent} from "ng-mocks";
import {AstrasLogoComponent} from "../../../../shared/components/astras-logo/astras-logo.component";

describe('DesktopNavbarComponent', () => {
  let component: DesktopNavbarComponent;
  let fixture: ComponentFixture<DesktopNavbarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        DesktopNavbarComponent,
        MockComponent(AstrasLogoComponent)
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DesktopNavbarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
