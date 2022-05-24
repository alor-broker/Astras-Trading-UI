import { ComponentFixture, TestBed } from '@angular/core/testing';
import { InfoService } from '../../../services/info.service';

import { AboutIssueComponent } from './about-issue.component';

describe('AboutIssueComponent', () => {
  let component: AboutIssueComponent;
  let fixture: ComponentFixture<AboutIssueComponent>;
  const infoSpy = jasmine.createSpyObj('InfoService', ['getIssue', 'getExchangeInfo']);
  infoSpy.getIssue.and.returnValue(null);

  beforeAll(() => TestBed.resetTestingModule());
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AboutIssueComponent ],
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
