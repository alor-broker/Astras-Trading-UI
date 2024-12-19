import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DescriptorsListComponent } from './descriptors-list.component';
import { TranslocoTestsModule } from "../../../../shared/utils/testing/translocoTestsModule";

describe('DescriptorsListComponent', () => {
  let component: DescriptorsListComponent;
  let fixture: ComponentFixture<DescriptorsListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        DescriptorsListComponent,
        TranslocoTestsModule.getModule()
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DescriptorsListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
