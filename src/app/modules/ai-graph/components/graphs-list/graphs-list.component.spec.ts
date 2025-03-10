import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GraphsListComponent } from './graphs-list.component';
import {TranslocoTestsModule} from "../../../../shared/utils/testing/translocoTestsModule";
import {MockProvider} from "ng-mocks";
import {GraphStorageService} from "../../services/graph-storage.service";
import {NEVER} from "rxjs";

describe('GraphsListComponent', () => {
  let component: GraphsListComponent;
  let fixture: ComponentFixture<GraphsListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        GraphsListComponent,
        TranslocoTestsModule.getModule()
      ],
      providers: [
        MockProvider(
          GraphStorageService,
          {
            getAllGraphs: () => NEVER,
          }
        )
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GraphsListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
