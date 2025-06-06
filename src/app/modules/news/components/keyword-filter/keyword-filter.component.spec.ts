import { ComponentFixture, TestBed } from '@angular/core/testing';

import { KeywordFilterComponent } from './keyword-filter.component';
import { TranslocoTestsModule } from "../../../../shared/utils/testing/translocoTestsModule";
import {
  MockComponent,
  MockDirective
} from "ng-mocks";
import {
  NzInputDirective,
  NzInputGroupComponent
} from "ng-zorro-antd/input";

describe('KeywordFilterComponent', () => {
  let component: KeywordFilterComponent;
  let fixture: ComponentFixture<KeywordFilterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        KeywordFilterComponent,
        TranslocoTestsModule.getModule(),
        MockDirective(NzInputDirective),
        MockComponent(NzInputGroupComponent)
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(KeywordFilterComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('validationOptions', {
      minLength: 1,
      maxLength: 10
    });

    fixture.componentRef.setInput('currentKeywords', []);
    fixture.componentRef.setInput('newKeywordPlaceholder', '');
    fixture.componentRef.setInput('tagColor', 'red');

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
