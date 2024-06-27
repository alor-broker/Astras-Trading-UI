import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TermsOfUseDialogComponent } from './terms-of-use-dialog.component';
import {
  getTranslocoModule,
  ngZorroMockComponents
} from "../../../../shared/utils/testing";
import { LetDirective } from "@ngrx/component";

describe('TermsOfUseDialogComponent', () => {
  let component: TermsOfUseDialogComponent;
  let fixture: ComponentFixture<TermsOfUseDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [getTranslocoModule()],
      declarations:[
        TermsOfUseDialogComponent,
        ...ngZorroMockComponents
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TermsOfUseDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
