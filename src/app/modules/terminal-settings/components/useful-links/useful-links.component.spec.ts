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
import { EnvironmentService } from "../../../../shared/services/environment.service";

describe('UsefulLinksComponent', () => {
  let component: UsefulLinksComponent;
  let fixture: ComponentFixture<UsefulLinksComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [getTranslocoModule()],
      declarations: [
        UsefulLinksComponent,
        ...ngZorroMockComponents,
        mockComponent({ selector: 'ats-external-link', inputs: ['href'] })
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
