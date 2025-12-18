import {ComponentFixture, TestBed} from '@angular/core/testing';

import {UsageDisclaimerComponent} from './usage-disclaimer.component';
import {TranslocoTestsModule} from "../../../../shared/utils/testing/translocoTestsModule";
import {MockComponents} from "ng-mocks";
import {NzAlertComponent} from "ng-zorro-antd/alert";
import {MarkdownComponent} from "ngx-markdown";

describe('UsageDisclaimerComponent', () => {
  let component: UsageDisclaimerComponent;
  let fixture: ComponentFixture<UsageDisclaimerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        TranslocoTestsModule.getModule(),
        UsageDisclaimerComponent,
        MockComponents(
          NzAlertComponent,
          MarkdownComponent
        )
      ]
    })
      .compileComponents();

    fixture = TestBed.createComponent(UsageDisclaimerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
