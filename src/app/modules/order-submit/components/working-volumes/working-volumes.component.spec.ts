import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WorkingVolumesComponent } from './working-volumes.component';
import { ngZorroMockComponents } from '../../../../shared/utils/testing';

describe('WorkingVolumesComponent', () => {
  let component: WorkingVolumesComponent;
  let fixture: ComponentFixture<WorkingVolumesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [
        ...ngZorroMockComponents,
        WorkingVolumesComponent
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WorkingVolumesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
