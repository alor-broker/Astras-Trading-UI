import {
  Directive,
  ElementRef,
  inject,
  ViewContainerRef
} from '@angular/core';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {MarkdownComponent} from 'ngx-markdown';
import {AiChatChart} from '../components/ai-chat-chart/ai-chat-chart';
import {AiChatChartHelper} from '../utils/ai-chat-chart.helper';

@Directive({
  selector: 'markdown[atsdAiChatCharts]'
})
export class AiChatChartsDirective {
  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef);

  private readonly charts = inject(ViewContainerRef);

  constructor() {
    inject(MarkdownComponent).ready.pipe(
      takeUntilDestroyed()
    ).subscribe(() => this.renderCharts());
  }

  private renderCharts(): void {
    // Clearing the Angular views also destroys the previous Chart.js instances.
    this.charts.clear();

    // Read the escaped code produced by ngx-markdown after its normal sanitization.
    // Keeping the complete Markdown document preserves lists, quotes and references.
    for (const code of this.element.nativeElement.querySelectorAll('pre > code.language-chart')) {
      const block = code.parentElement;
      if (block == null) {
        continue;
      }

      const chart = this.charts.createComponent(AiChatChart);
      chart.setInput('definition', AiChatChartHelper.parse(code.textContent ?? ''));
      const chartElement = chart.location.nativeElement as HTMLElement;
      block.replaceWith(chartElement);
      chart.changeDetectorRef.detectChanges();
    }
  }
}
