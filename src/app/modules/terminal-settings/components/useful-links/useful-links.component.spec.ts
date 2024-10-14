import {
  ComponentFixture,
  TestBed
} from '@angular/core/testing';

import { UsefulLinksComponent } from './useful-links.component';
import { EnvironmentService } from "../../../../shared/services/environment.service";
import { TranslocoTestsModule } from "../../../../shared/utils/testing/translocoTestsModule";
import { ngZorroMockComponents } from "../../../../shared/utils/testing/ng-zorro-component-mocks";
import { ComponentHelpers } from "../../../../shared/utils/testing/component-helpers";

describe('UsefulLinksComponent', () => {
  let component: UsefulLinksComponent;
  let fixture: ComponentFixture<UsefulLinksComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TranslocoTestsModule.getModule()],
      declarations: [
        UsefulLinksComponent,
        ...ngZorroMockComponents,
        ComponentHelpers.mockComponent({ selector: 'ats-external-link', inputs: ['href'] })
      ],
      providers:[
        {
          provide: EnvironmentService,
          useValue: {
            externalLinks: {
              officialSite: '',
              riskRate: '',
              personalAccount: '',
              bankroll: '',
              services: ''
            }
          }
        }
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
