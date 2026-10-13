import {
  ComponentFixture,
  TestBed
} from '@angular/core/testing';
import {
  firstValueFrom,
  Observable,
  take
} from 'rxjs';
import {
  MarkdownComponent,
  provideMarkdown
} from 'ngx-markdown';
import {By} from '@angular/platform-browser';
import {ThemeService} from '@terminal-core-lib/features/themes/services/theme.service';
import {ThemeSettings} from '@terminal-core-lib/features/themes/themes.types';
import {AiChatChart} from '../components/ai-chat-chart/ai-chat-chart';
import {AiChatTextMessage} from '../components/ai-chat-text-message/ai-chat-text-message';

describe('AiChatChartsDirective', () => {
  const chartJson = JSON.stringify({
    version: 1,
    type: 'bar',
    title: '<img src=x onerror=alert(1)>',
    data: {labels: ['A'], series: [{name: 'Value', values: [10]}]}
  });
  const chartBlock = '```chart\n' + chartJson + '\n```';
  let disposeTheme: ReturnType<typeof vi.fn<() => void>>;

  beforeEach(() => {
    disposeTheme = vi.fn();
    TestBed.configureTestingModule({
      imports: [AiChatTextMessage],
      providers: [
        provideMarkdown(),
        {
          provide: ThemeService,
          useValue: {getThemeSettings: (): Observable<ThemeSettings> => new Observable<ThemeSettings>(() => disposeTheme)}
        }
      ]
    });
    // Exercise real Markdown and Angular view ownership without requiring a canvas.
    TestBed.overrideComponent(AiChatChart, {
      set: {
        imports: [],
        template: '@if (definition(); as chart) {<span>{{ chart.title }}</span>} @else {<span>Invalid chart</span>}'
      }
    });
  });

  async function render(source: string): Promise<{fixture: ComponentFixture<AiChatTextMessage>, element: HTMLElement}> {
    const fixture = TestBed.createComponent(AiChatTextMessage);
    fixture.componentRef.setInput('content', {text: source});
    fixture.detectChanges();
    const markdown = fixture.debugElement.query(By.directive(MarkdownComponent)).componentInstance as MarkdownComponent;
    await firstValueFrom(markdown.ready.pipe(take(1)));
    await fixture.whenStable();
    return {fixture, element: fixture.nativeElement as HTMLElement};
  }

  it('should render multiple charts in place while preserving surrounding Markdown and escaping titles', async () => {
    const {element} = await render('Before **chart**\n\n' + chartBlock + '\n\nBetween\n\n' + chartBlock + '\n\nAfter');
    const markdown = element.querySelector('markdown')!;

    expect([...markdown.children].map(child => child.tagName.toLowerCase())).toEqual([
      'p', 'atsd-ai-chat-chart', 'p', 'atsd-ai-chat-chart', 'p'
    ]);
    expect(markdown.querySelector('strong')?.textContent).toBe('chart');
    expect(markdown.querySelector('atsd-ai-chat-chart')?.textContent).toBe('<img src=x onerror=alert(1)>');
    expect(markdown.querySelector('img')).toBeNull();
  });

  it('should preserve chart nesting inside quotes and lists', async () => {
    const quoted = chartBlock.split('\n').map(line => '> ' + line).join('\n');
    const listed = '- Item\n\n' + chartBlock.split('\n').map(line => '  ' + line).join('\n');

    const {element} = await render(quoted + '\n\n' + listed);

    expect(element.querySelector('blockquote atsd-ai-chat-chart')).not.toBeNull();
    expect(element.querySelector('li atsd-ai-chat-chart')).not.toBeNull();
  });

  it('should leave other code blocks and literal chart examples as code', async () => {
    const {element} = await render('```json\n' + chartJson + '\n```\n\n````markdown\n' + chartBlock + '\n````');

    expect(element.querySelectorAll('atsd-ai-chat-chart')).toHaveLength(0);
    expect(element.querySelectorAll('pre > code')).toHaveLength(2);
  });

  it('should isolate a malformed chart without losing the rest of the response', async () => {
    const {element} = await render('```chart\n{broken\n```\n\n' + chartBlock + '\n\n**After**');

    const charts = element.querySelectorAll('atsd-ai-chat-chart');
    expect(charts).toHaveLength(2);
    expect(charts[0].textContent).toBe('Invalid chart');
    expect(element.querySelector('strong')?.textContent).toBe('After');
  });

  it('should destroy old chart views when the message changes and on teardown', async () => {
    const {fixture, element} = await render(chartBlock);
    const oldChart = element.querySelector('atsd-ai-chat-chart');
    const markdown = fixture.debugElement.query(By.directive(MarkdownComponent)).componentInstance as MarkdownComponent;
    const ready = firstValueFrom(markdown.ready.pipe(take(1)));

    fixture.componentRef.setInput('content', {text: 'Updated\n\n' + chartBlock});
    fixture.detectChanges();
    await ready;
    await fixture.whenStable();

    expect(element.querySelectorAll('atsd-ai-chat-chart')).toHaveLength(1);
    expect(element.querySelector('atsd-ai-chat-chart')).not.toBe(oldChart);
    expect(disposeTheme).toHaveBeenCalledTimes(1);

    fixture.destroy();

    expect(disposeTheme).toHaveBeenCalledTimes(2);
  });
});
