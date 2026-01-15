import {ComponentFixture, TestBed} from '@angular/core/testing';

import {PresetsComponent} from './presets.component';
import {TranslocoTestsModule} from "../../../../shared/utils/testing/translocoTestsModule";
import {FormsTesting} from "../../../../shared/utils/testing/forms-testing";
import {MockComponents, MockDirectives} from "ng-mocks";
import {NzTagComponent} from "ng-zorro-antd/tag";
import {NzTooltipDirective} from "ng-zorro-antd/tooltip";
import {NzIconDirective} from "ng-zorro-antd/icon";
import {NzPopconfirmDirective} from "ng-zorro-antd/popconfirm";
import {GuidGenerator} from "../../../../shared/utils/guid";

describe('PresetsComponent', () => {
  let component: PresetsComponent;
  let fixture: ComponentFixture<PresetsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        TranslocoTestsModule.getModule(),
        PresetsComponent,
        FormsTesting.getMocks(),
        MockComponents(
          NzTagComponent
        ),
        MockDirectives(
          NzTooltipDirective,
          NzIconDirective,
          NzPopconfirmDirective
        )
      ]
    });
    fixture = TestBed.createComponent(PresetsComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('guid', GuidGenerator.newGuid());
    fixture.componentRef.setInput('presets', []);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
