import {
  ComponentFixture,
  TestBed
} from '@angular/core/testing';

import { UsefulLinksComponent } from './useful-links.component';
import {
  getTranslocoModule,
  mockComponent,
  ngZorroMockComponents
} from '../../../../shared/utils/testing';

describe('UsefulLinksComponent', () => {
  let component: UsefulLinksComponent;
  let fixture: ComponentFixture<UsefulLinksComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [getTranslocoModule()],
      declarations: [
        UsefulLinksComponent,
        ...ngZorroMockComponents,
        mockComponent({ selector: 'ats-external-link' })
      ]
    })
      .compileComponents();

    fixture = TestBed.createComponent(UsefulLinksComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
