import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CommonInfoComponent } from './common-info.component';
import { MockProviders } from "ng-mocks";
import { GraphQlService } from "../../../../../shared/services/graph-ql.service";
import { TranslocoTestsModule } from "../../../../../shared/utils/testing/translocoTestsModule";

describe('CommonInfoComponent', () => {
  let component: CommonInfoComponent;
  let fixture: ComponentFixture<CommonInfoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        CommonInfoComponent,
        TranslocoTestsModule.getModule()
      ],
      providers: [
        MockProviders(
          GraphQlService
        )
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CommonInfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
