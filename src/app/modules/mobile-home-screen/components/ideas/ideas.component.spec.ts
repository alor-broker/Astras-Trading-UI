import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IdeasComponent } from './ideas.component';
import { MockComponent } from "ng-mocks";
import { IdeasSectionDetailsComponent } from "../ideas-section-details/ideas-section-details.component";

describe('IdeasComponent', () => {
  let component: IdeasComponent;
  let fixture: ComponentFixture<IdeasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        IdeasComponent,
        MockComponent(IdeasSectionDetailsComponent)
      ],
    })
    .compileComponents();

    fixture = TestBed.createComponent(IdeasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
