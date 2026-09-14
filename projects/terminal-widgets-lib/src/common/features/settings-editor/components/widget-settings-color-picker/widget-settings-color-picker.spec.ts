import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation
} from '@angular/core';
import {TestBed} from '@angular/core/testing';
import {
  FormControl,
  FormGroup,
  NgModel,
  ReactiveFormsModule
} from '@angular/forms';
import {By} from '@angular/platform-browser';
import {provideNoopAnimations} from '@angular/platform-browser/animations';
import {NzColorPickerComponent} from 'ng-zorro-antd/color-picker';
import {WidgetSettingsColorPicker} from './widget-settings-color-picker';
import {WidgetSettingsForm} from '../widget-settings-form/widget-settings-form';

@Component({
  imports: [
    ReactiveFormsModule,
    WidgetSettingsColorPicker,
    WidgetSettingsForm
  ],
  template: `
    <ats-widget-settings-form [formGroup]="form">
      <ats-widget-settings-color-picker formControlName="color" label="Color"/>
    </ats-widget-settings-form>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
class TestHost {
  readonly form = new FormGroup({
    color: new FormControl('#112233', {nonNullable: true})
  });
}

describe('WidgetSettingsColorPicker', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideNoopAnimations()]
    });
  });

  it('should synchronize its value and touched state with the form control', () => {
    const fixture = TestBed.createComponent(TestHost);
    fixture.detectChanges();

    const host = fixture.nativeElement.querySelector('ats-widget-settings-color-picker') as HTMLElement;
    const ngModel = fixture.debugElement.query(By.directive(NgModel)).injector.get(NgModel);
    const formItem = fixture.nativeElement.querySelector('nz-form-item') as HTMLElement;
    const label = fixture.nativeElement.querySelector('nz-form-label label') as HTMLLabelElement;

    expect(ngModel.model).toBe('#112233');
    expect(formItem.classList).toContain('ant-form-item-horizontal');
    expect(label.classList).toContain('ant-form-item-no-colon');

    ngModel.viewToModelUpdate('#445566');
    host.dispatchEvent(new FocusEvent('focusout'));
    fixture.detectChanges();

    expect(fixture.componentInstance.form.controls.color.value).toBe('#445566');
    expect(fixture.componentInstance.form.controls.color.touched).toBe(true);
  });

  it('should propagate the disabled state to the inner color picker', () => {
    const fixture = TestBed.createComponent(TestHost);
    fixture.detectChanges();

    fixture.componentInstance.form.controls.color.disable();
    fixture.detectChanges();

    const colorPicker = fixture.debugElement.query(By.directive(NzColorPickerComponent)).componentInstance as NzColorPickerComponent;
    expect(colorPicker.nzDisabled).toBe(true);
  });
});
