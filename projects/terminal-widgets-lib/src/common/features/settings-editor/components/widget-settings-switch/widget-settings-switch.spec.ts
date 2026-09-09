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
import {provideNoopAnimations} from '@angular/platform-browser/animations';
import {WidgetSettingsForm} from '../widget-settings-form/widget-settings-form';
import {WidgetSettingsSwitch} from './widget-settings-switch';

@Component({
  imports: [
    ReactiveFormsModule,
    WidgetSettingsForm,
    WidgetSettingsSwitch
  ],
  template: `
    <ats-widget-settings-form [formGroup]="form">
      <ats-widget-settings-switch formControlName="enabled" label="Enabled"/>
    </ats-widget-settings-form>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
class TestHost {
  readonly form = new FormGroup({
    enabled: new FormControl(true, {nonNullable: true})
  });
}

describe('WidgetSettingsSwitch', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideNoopAnimations()]
    });
  });

  it('should synchronize its value and touched state with the form control', async () => {
    const fixture = TestBed.createComponent(TestHost);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const host = fixture.nativeElement.querySelector('ats-widget-settings-switch') as HTMLElement;
    const button = fixture.nativeElement.querySelector('.ant-switch') as HTMLButtonElement;
    const formItem = fixture.nativeElement.querySelector('nz-form-item') as HTMLElement;
    const label = fixture.nativeElement.querySelector('nz-form-label label') as HTMLLabelElement;

    expect(button.classList).toContain('ant-switch-checked');
    expect(formItem.classList).toContain('ant-form-item-horizontal');
    expect(label.classList).toContain('ant-form-item-no-colon');

    button.click();
    host.dispatchEvent(new FocusEvent('focusout'));
    fixture.detectChanges();

    expect(fixture.componentInstance.form.controls.enabled.value).toBe(false);
    expect(fixture.componentInstance.form.controls.enabled.touched).toBe(true);
  });

  it('should propagate the disabled state to the inner switch', () => {
    const fixture = TestBed.createComponent(TestHost);
    fixture.detectChanges();

    fixture.componentInstance.form.controls.enabled.disable();
    fixture.detectChanges();

    const button = fixture.nativeElement.querySelector('.ant-switch') as HTMLButtonElement;
    expect(button.disabled).toBe(true);
  });
});
