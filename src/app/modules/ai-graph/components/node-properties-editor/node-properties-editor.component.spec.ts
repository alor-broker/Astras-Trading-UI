import {ComponentFixture, TestBed} from '@angular/core/testing';

import {NodePropertiesEditorComponent} from './node-properties-editor.component';
import {TranslocoTestsModule} from "../../../../shared/utils/testing/translocoTestsModule";
import {MockComponents} from "ng-mocks";
import {
  StringPropertyEditorComponent
} from "../property-editors/string-property-editor/string-property-editor.component";
import {
  NumberPropertyEditorComponent
} from "../property-editors/number-property-editor/number-property-editor.component";
import {
  BooleanPropertyEditorComponent
} from "../property-editors/boolean-property-editor/boolean-property-editor.component";
import {TextPropertyEditorComponent} from "../property-editors/text-property-editor/text-property-editor.component";
import {DatePropertyEditorComponent} from "../property-editors/date-property-editor/date-property-editor.component";
import {
  PortfolioPropertyEditorComponent
} from "../property-editors/portfolio-property-editor/portfolio-property-editor.component";

describe('NodePropertiesEditorComponent', () => {
  let component: NodePropertiesEditorComponent;
  let fixture: ComponentFixture<NodePropertiesEditorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        NodePropertiesEditorComponent,
        TranslocoTestsModule.getModule(),
        MockComponents(
          StringPropertyEditorComponent,
          NumberPropertyEditorComponent,
          BooleanPropertyEditorComponent,
          TextPropertyEditorComponent,
          DatePropertyEditorComponent,
          PortfolioPropertyEditorComponent
        )
      ]
    })
      .compileComponents();

    fixture = TestBed.createComponent(NodePropertiesEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
