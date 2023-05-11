import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ArbitrationExtensionManageComponent } from './arbitration-extension-manage.component';
import { commonTestProviders, getTranslocoModule, sharedModuleImportForTests } from "../../../../shared/utils/testing";

describe('ArbitrationExtensionManageComponent', () => {
  let component: ArbitrationExtensionManageComponent;
  let fixture: ComponentFixture<ArbitrationExtensionManageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ArbitrationExtensionManageComponent ],
      imports: [...sharedModuleImportForTests, getTranslocoModule()],
      providers: [...commonTestProviders]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ArbitrationExtensionManageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
