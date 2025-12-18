import {ComponentFixture, TestBed} from '@angular/core/testing';

import {UsefulLinksComponent} from './useful-links.component';
import {EnvironmentService} from "../../../../shared/services/environment.service";
import {TranslocoTestsModule} from "../../../../shared/utils/testing/translocoTestsModule";
import {MockComponents, MockDirectives} from "ng-mocks";
import {ExternalLinkComponent} from "../../../../shared/components/external-link/external-link.component";
import {NzColDirective, NzRowDirective} from "ng-zorro-antd/grid";

describe('UsefulLinksComponent', () => {
  let component: UsefulLinksComponent;
  let fixture: ComponentFixture<UsefulLinksComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        TranslocoTestsModule.getModule(),
        UsefulLinksComponent,
        MockComponents(
          ExternalLinkComponent
        ),
        MockDirectives(
          NzRowDirective,
          NzColDirective,
        )
      ],
      providers: [
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
