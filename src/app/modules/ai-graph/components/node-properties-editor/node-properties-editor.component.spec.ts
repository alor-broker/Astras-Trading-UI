import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NodePropertiesEditorComponent } from './node-properties-editor.component';
import {TranslocoTestsModule} from "../../../../shared/utils/testing/translocoTestsModule";

describe('NodePropertiesEditorComponent', () => {
  let component: NodePropertiesEditorComponent;
  let fixture: ComponentFixture<NodePropertiesEditorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        NodePropertiesEditorComponent,
        TranslocoTestsModule.getModule()
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
