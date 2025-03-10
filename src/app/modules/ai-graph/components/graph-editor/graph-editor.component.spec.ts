import {ComponentFixture, TestBed} from '@angular/core/testing';

import {GraphEditorComponent} from './graph-editor.component';
import {TranslocoTestsModule} from "../../../../shared/utils/testing/translocoTestsModule";
import {MockComponent} from "ng-mocks";
import {SideMenuComponent} from "../side-menu/side-menu.component";

describe('GraphEditorComponent', () => {
  let component: GraphEditorComponent;
  let fixture: ComponentFixture<GraphEditorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        GraphEditorComponent,
        TranslocoTestsModule.getModule(),
        MockComponent(SideMenuComponent)
      ]
    })
      .compileComponents();

    fixture = TestBed.createComponent(GraphEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
