import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GraphRunnerPanelComponent } from './graph-runner-panel.component';
import {MockDirective, MockProvider} from "ng-mocks";
import {GraphProcessingContextService} from "../../services/graph-processing-context.service";
import {NzIconDirective} from "ng-zorro-antd/icon";

describe('GraphRunnerPanelComponent', () => {
  let component: GraphRunnerPanelComponent;
  let fixture: ComponentFixture<GraphRunnerPanelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        GraphRunnerPanelComponent,
        MockDirective(NzIconDirective)
      ],
      providers:[
        MockProvider(GraphProcessingContextService)
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GraphRunnerPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
