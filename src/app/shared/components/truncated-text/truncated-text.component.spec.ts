import {ComponentFixture, TestBed} from '@angular/core/testing';
import {TruncatedTextComponent} from './truncated-text.component';

describe('TruncatedTextComponent', () => {
  let component: TruncatedTextComponent;
  let fixture: ComponentFixture<TruncatedTextComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TruncatedTextComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(TruncatedTextComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default values', () => {
    expect(component.text()).toBe('');
    expect(component.maxLength()).toBe(0);
    expect(component.className()).toBe('');
  });

  it('should truncate text when length exceeds maxLength', () => {
    fixture.componentRef.setInput(
      'text',
      'Hello World'
    );
    fixture.componentRef.setInput(
      'maxLength',
      5
    );

    expect(component.shouldBeTruncated()).toBe(true);
    expect(component.truncatedText).toBe('Hello...');
  });

  it('should not truncate text when length is less than maxLength', () => {
    fixture.componentRef.setInput(
      'text',
      'Hello'
    );
    fixture.componentRef.setInput(
      'maxLength',
      10
    );

    expect(component.shouldBeTruncated()).toBe(false);
    expect(component.truncatedText).toBe('Hello');
  });

  it('should truncate text when maxLength is 0', () => {
    fixture.componentRef.setInput(
      'text',
      'Hello World'
    );

    fixture.componentRef.setInput(
      'maxLength',
      0
    );

    expect(component.shouldBeTruncated()).toBe(true);
    expect(component.truncatedText).toBe('...');
  });
});
