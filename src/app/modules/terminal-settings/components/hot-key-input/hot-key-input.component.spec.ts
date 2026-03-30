import {ComponentFixture, TestBed} from '@angular/core/testing';

import {HotKeyInputComponent} from './hot-key-input.component';
import {TranslocoTestsModule} from "../../../../shared/utils/testing/translocoTestsModule";
import {FormsTesting} from "../../../../shared/utils/testing/forms-testing";

describe('HotKeyInputComponent', () => {
  let component: HotKeyInputComponent;
  let fixture: ComponentFixture<HotKeyInputComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        HotKeyInputComponent,
        TranslocoTestsModule.getModule(),
        ...FormsTesting.getMocks()
      ]
    })
      .compileComponents();

    fixture = TestBed.createComponent(HotKeyInputComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('actionName', 'test');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
