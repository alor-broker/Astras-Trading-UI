import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AboutIssueComponent } from './about-issue.component';

describe('AboutIssueComponent', () => {
  let component: AboutIssueComponent;
  let fixture: ComponentFixture<AboutIssueComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AboutIssueComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AboutIssueComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
