import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation
} from '@angular/core';
import {TestBed} from '@angular/core/testing';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule
} from '@angular/forms';
import {WidgetSettingsForm} from './widget-settings-form';

@Component({
  imports: [
    ReactiveFormsModule,
    WidgetSettingsForm
  ],
  template: `
    <ats-widget-settings-form [formGroup]="form">
      <input formControlName="value"/>
    </ats-widget-settings-form>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
class TestHost {
  readonly form = new FormGroup({
    value: new FormControl('', {nonNullable: true})
  });
}

describe('WidgetSettingsForm', () => {
  it('should apply the vertical form layout and preserve reactive form binding', () => {
    const fixture = TestBed.createComponent(TestHost);
    fixture.detectChanges();

    const formElement = fixture.nativeElement.querySelector('ats-widget-settings-form') as HTMLElement;
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;

    input.value = 'updated';
    input.dispatchEvent(new Event('input'));

    expect(formElement.classList).toContain('ant-form');
    expect(formElement.classList).toContain('ant-form-vertical');
    expect(fixture.componentInstance.form.controls.value.value).toBe('updated');
  });
});
