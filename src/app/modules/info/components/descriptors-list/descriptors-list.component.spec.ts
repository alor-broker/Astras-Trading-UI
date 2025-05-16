import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DescriptorsListComponent } from './descriptors-list.component';
import { TranslocoTestsModule } from "../../../../shared/utils/testing/translocoTestsModule";
import { MockDirective } from "ng-mocks";
import { NzTooltipDirective } from "ng-zorro-antd/tooltip";

describe('DescriptorsListComponent', () => {
  let component: DescriptorsListComponent;
  let fixture: ComponentFixture<DescriptorsListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        DescriptorsListComponent,
        TranslocoTestsModule.getModule(),
        MockDirective(NzTooltipDirective)
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
