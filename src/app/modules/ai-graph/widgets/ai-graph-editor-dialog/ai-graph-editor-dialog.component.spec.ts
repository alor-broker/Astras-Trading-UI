import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AiGraphEditorDialogComponent } from './ai-graph-editor-dialog.component';
import {TranslocoTestsModule} from "../../../../shared/utils/testing/translocoTestsModule";
import {MockProvider} from "ng-mocks";
import {GraphStorageService} from "../../services/graph-storage.service";
import {EMPTY} from "rxjs";

describe('AiGraphEditorDialogComponent', () => {
  let component: AiGraphEditorDialogComponent;
  let fixture: ComponentFixture<AiGraphEditorDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        AiGraphEditorDialogComponent,
        TranslocoTestsModule.getModule()
      ],
      providers: [
        MockProvider(
          GraphStorageService,
          {
            getAllGraphs: () => EMPTY
          }
        )
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AiGraphEditorDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
