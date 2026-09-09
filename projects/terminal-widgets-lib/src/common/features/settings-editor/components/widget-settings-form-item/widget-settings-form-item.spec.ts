import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation
} from '@angular/core';
import {TestBed} from '@angular/core/testing';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import {provideNoopAnimations} from '@angular/platform-browser/animations';
import {WidgetSettingsForm} from '../widget-settings-form/widget-settings-form';
import {WidgetSettingsFormItem} from './widget-settings-form-item';

@Component({
  selector: 'nz-select',
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
class TestSelect {}

@Component({
  selector: 'ats-test-control',
  imports: [TestSelect],
  template: '<nz-select/>',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
class TestCompositeControl {}

@Component({
  imports: [
    ReactiveFormsModule,
    TestCompositeControl,
    TestSelect,
    WidgetSettingsForm,
    WidgetSettingsFormItem
  ],
  template: `
    <ats-widget-settings-form [formGroup]="form">
      <ats-widget-settings-form-item
        errorTip="Required value"
        label="Value"
        [required]="true"
      >
        <input formControlName="value"/>
      </ats-widget-settings-form-item>
      <ats-widget-settings-form-item label="Option">
        <nz-select/>
      </ats-widget-settings-form-item>
      <ats-widget-settings-form-item label="Composite option">
        <ats-test-control/>
      </ats-widget-settings-form-item>
    </ats-widget-settings-form>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
class TestHost {
  readonly form = new FormGroup({
    value: new FormControl('', {
      nonNullable: true,
      validators: Validators.required
    })
  });
}

describe('WidgetSettingsFormItem', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideNoopAnimations()]
    });
  });

  it('should render label metadata and an error for the projected control', async () => {
    const fixture = TestBed.createComponent(TestHost);
    fixture.detectChanges();

    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    input.value = 'valid';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    input.value = '';
    input.dispatchEvent(new Event('input'));
    input.dispatchEvent(new FocusEvent('blur'));
    fixture.detectChanges();
    await fixture.whenStable();

    const label = fixture.nativeElement.querySelector('nz-form-label label') as HTMLLabelElement;
    const error = fixture.nativeElement.querySelector('.ant-form-item-explain-error') as HTMLElement;

    expect(label.textContent?.trim()).toBe('Value');
    expect(label.htmlFor).toBe('value');
    expect(label.classList).toContain('ant-form-item-required');
    expect(error.textContent?.trim()).toBe('Required value');
  });

  it('should stretch a projected select to the control width', () => {
    const fixture = TestBed.createComponent(TestHost);
    fixture.detectChanges();

    const select = fixture.nativeElement.querySelector('nz-select') as HTMLElement;

    expect(getComputedStyle(select).width).toBe('100%');
  });

  it('should stretch a projected composite control and its nested select', () => {
    const fixture = TestBed.createComponent(TestHost);
    fixture.detectChanges();

    const control = fixture.nativeElement.querySelector('ats-test-control') as HTMLElement;
    const select = control.querySelector('nz-select') as HTMLElement;

    expect(getComputedStyle(control).display).toBe('block');
    expect(getComputedStyle(control).width).toBe('100%');
    expect(getComputedStyle(select).width).toBe('100%');
  });
});
