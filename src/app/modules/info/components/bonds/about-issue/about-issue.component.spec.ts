import { ComponentFixture, TestBed } from '@angular/core/testing';
import { InfoService } from '../../../services/info.service';

import { AboutIssueComponent } from './about-issue.component';
import { of } from "rxjs";
import { ComponentHelpers } from "../../../../../shared/utils/testing/component-helpers";

describe('AboutIssueComponent', () => {
  let component: AboutIssueComponent;
  let fixture: ComponentFixture<AboutIssueComponent>;
  const infoSpy = jasmine.createSpyObj('InfoService', ['getIssue', 'getExchangeInfo']);
  infoSpy.getIssue.and.returnValue(null);
  infoSpy.getExchangeInfo.and.returnValue(of({}));

  beforeAll(() => TestBed.resetTestingModule());
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [
        AboutIssueComponent,
        ComponentHelpers.mockComponent({
          selector: 'ats-loading-indicator',
          inputs: ['isLoading']
        })
      ],
      providers: [
        { provide: InfoService, useValue: infoSpy}
      ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AboutIssueComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => fixture?.destroy());

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
