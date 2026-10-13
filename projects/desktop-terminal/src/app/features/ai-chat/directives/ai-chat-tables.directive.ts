import {
  Directive,
  ElementRef,
  inject
} from '@angular/core';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {MarkdownComponent} from 'ngx-markdown';

@Directive({
  selector: 'markdown[atsdAiChatTables]'
})
export class AiChatTablesDirective {
  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef);

  constructor() {
    inject(MarkdownComponent).ready.pipe(
      takeUntilDestroyed()
    ).subscribe(() => this.wrapTables());
  }

  private wrapTables(): void {
    for (const table of this.element.nativeElement.querySelectorAll('table')) {
      if (table.parentElement?.classList.contains('markdown-table-scroll') === true) {
        continue;
      }

      const container = table.ownerDocument.createElement('div');
      container.className = 'markdown-table-scroll show-scroll';
      container.tabIndex = 0;
      table.replaceWith(container);
      container.appendChild(table);
    }
  }
}
