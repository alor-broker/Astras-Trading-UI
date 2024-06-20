import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TermsOfUseDialogWidgetComponent } from './terms-of-use-dialog-widget.component';
import {
  getTranslocoModule,
  ngZorroMockComponents
} from "../../../../shared/utils/testing";
import { LetDirective } from "@ngrx/component";

describe('TermsOfUseDialogWidgetComponent', () => {
  let component: TermsOfUseDialogWidgetComponent;
  let fixture: ComponentFixture<TermsOfUseDialogWidgetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [getTranslocoModule()],
      declarations:[
        TermsOfUseDialogWidgetComponent,
        ...ngZorroMockComponents
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TermsOfUseDialogWidgetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
