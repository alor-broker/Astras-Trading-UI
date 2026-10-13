import {
  ComponentFixture,
  TestBed
} from '@angular/core/testing';
import {By} from '@angular/platform-browser';
import {
  firstValueFrom,
  take
} from 'rxjs';
import {
  MarkdownComponent,
  provideMarkdown
} from 'ngx-markdown';
import {AiChatTextMessage} from '../components/ai-chat-text-message/ai-chat-text-message';

describe('AiChatTablesDirective', () => {
  const tableSource = '| Instrument | Value |\n| :--- | ---: |\n| **Stock** | 123.45 |';
  let fixture: ComponentFixture<AiChatTextMessage>;
  let element: HTMLElement;
  let markdown: MarkdownComponent;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      imports: [AiChatTextMessage],
      providers: [provideMarkdown()]
    });
    fixture = TestBed.createComponent(AiChatTextMessage);
    element = fixture.nativeElement as HTMLElement;
    fixture.componentRef.setInput('content', {text: 'Initial message'});
    fixture.detectChanges();
    markdown = fixture.debugElement.query(By.directive(MarkdownComponent)).componentInstance as MarkdownComponent;
    await firstValueFrom(markdown.ready.pipe(take(1)));
    await fixture.whenStable();
  });

  it('should give each table a keyboard-focusable scroll container without wrapping surrounding text', async () => {
    await markdown.render('Before\n\n' + tableSource + '\n\nBetween\n\n' + tableSource + '\n\nAfter');

    const wrappers = element.querySelectorAll<HTMLElement>('.markdown-table-scroll');
    expect(wrappers).toHaveLength(2);
    expect([...wrappers].every(wrapper => wrapper.tabIndex === 0 && wrapper.children.length === 1)).toBe(true);
    expect(element.querySelector('markdown > p')?.textContent).toBe('Before');
    expect(wrappers[0].querySelector('thead th')?.textContent).toBe('Instrument');
    expect(wrappers[0].querySelector('tbody td strong')?.textContent).toBe('Stock');
    expect(wrappers[0].querySelector('tbody td:last-child')?.getAttribute('align')).toBe('right');
  });

  it('should replace table wrappers on re-render without duplicating or retaining old content', async () => {
    await markdown.render(tableSource);
    await markdown.render(tableSource);

    expect(element.querySelectorAll('.markdown-table-scroll')).toHaveLength(1);
    expect(element.querySelector('.markdown-table-scroll .markdown-table-scroll')).toBeNull();

    await markdown.render('Plain text');

    expect(element.querySelector('.markdown-table-scroll')).toBeNull();
    expect(element.querySelector('markdown')?.textContent).toContain('Plain text');
  });

  it('should preserve tables inside quotes and leave table examples in code blocks unchanged', async () => {
    const quote = tableSource.split('\n').map(line => '> ' + line).join('\n');

    await markdown.render(quote + '\n\n```markdown\n' + tableSource + '\n```');

    expect(element.querySelector('blockquote > .markdown-table-scroll > table')).not.toBeNull();
    expect(element.querySelectorAll('.markdown-table-scroll')).toHaveLength(1);
    expect(element.querySelector('pre code')?.textContent).toContain(tableSource);
  });
});
