import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RunConfigBtnComponent } from './run-config-btn.component';
import {MockDirective, MockProvider} from "ng-mocks";
import {GraphProcessingContextService} from "../../services/graph-processing-context.service";
import {NzIconDirective} from "ng-zorro-antd/icon";

describe('RunConfigBtnComponent', () => {
  let component: RunConfigBtnComponent;
  let fixture: ComponentFixture<RunConfigBtnComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        RunConfigBtnComponent,
        MockDirective(NzIconDirective)
      ],
      providers:[
        MockProvider(GraphProcessingContextService)
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RunConfigBtnComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
