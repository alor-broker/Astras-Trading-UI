import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UsageDisclaimerComponent } from './usage-disclaimer.component';
import { ngZorroMockComponents } from "../../../../shared/utils/testing/ng-zorro-component-mocks";

describe('UsageDisclaimerComponent', () => {
  let component: UsageDisclaimerComponent;
  let fixture: ComponentFixture<UsageDisclaimerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [
        UsageDisclaimerComponent,
        ...ngZorroMockComponents
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UsageDisclaimerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
