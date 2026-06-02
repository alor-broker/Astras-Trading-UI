import {TestBed} from '@angular/core/testing';
import {TruncatedTextComponent} from './truncated-text';

describe('TruncatedTextComponent', () => {
  function createComponent(text: string, maxLength: number): TruncatedTextComponent {
    const fixture = TestBed.createComponent(TruncatedTextComponent);
    fixture.componentRef.setInput('text', text);
    fixture.componentRef.setInput('maxLength', maxLength);

    return fixture.componentInstance;
  }

  describe('shouldBeTruncated', () => {
    it('should be true when the text is longer than maxLength', () => {
      expect(createComponent('Hello World', 5).shouldBeTruncated()).toBe(true);
    });

    it('should be false when the text length equals maxLength', () => {
      expect(createComponent('Hello', 5).shouldBeTruncated()).toBe(false);
    });

    it('should be false when the text is shorter than maxLength', () => {
      expect(createComponent('Hi', 5).shouldBeTruncated()).toBe(false);
    });
  });

  describe('truncatedText', () => {
    it('should cut the text to maxLength and append an ellipsis when too long', () => {
      expect(createComponent('Hello World', 5).truncatedText).toBe('Hello...');
    });

    it('should return the full text when it fits', () => {
      expect(createComponent('Hello', 5).truncatedText).toBe('Hello');
    });

    it('should truncate to an ellipsis only with the default maxLength of 0', () => {
      expect(createComponent('Hello', 0).truncatedText).toBe('...');
    });
  });
});
