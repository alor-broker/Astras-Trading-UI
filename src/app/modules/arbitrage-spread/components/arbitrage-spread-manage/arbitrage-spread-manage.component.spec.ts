import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ArbitrageSpreadManageComponent } from './arbitrage-spread-manage.component';
import { commonTestProviders, getTranslocoModule, sharedModuleImportForTests } from "../../../../shared/utils/testing";

describe('ArbitrageSpreadManageComponent', () => {
  let component: ArbitrageSpreadManageComponent;
  let fixture: ComponentFixture<ArbitrageSpreadManageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ArbitrageSpreadManageComponent ],
      imports: [...sharedModuleImportForTests, getTranslocoModule()],
      providers: [...commonTestProviders]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ArbitrageSpreadManageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
