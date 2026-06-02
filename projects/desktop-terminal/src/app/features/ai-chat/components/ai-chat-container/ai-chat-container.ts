import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  contentChildren,
  DestroyRef,
  ElementRef,
  inject,
  viewChild,
  ViewEncapsulation
} from '@angular/core';
import {
  takeUntilDestroyed,
  toObservable
} from '@angular/core/rxjs-interop';
import {startWith} from 'rxjs';
import {AiChatMessageContainer} from '../ai-chat-message-container/ai-chat-message-container';

@Component({
  selector: 'atsd-ai-chat-container',
  imports: [],
  templateUrl: './ai-chat-container.html',
  styleUrl: './ai-chat-container.less',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AiChatContainer implements AfterViewInit {
  readonly messagesContainer = viewChild.required<ElementRef<HTMLDivElement>>('messagesContainer');

  readonly messages = contentChildren(AiChatMessageContainer);

  private readonly DestroyRef = inject(DestroyRef);

  private readonly messagesChanges$ = toObservable(this.messages);

  ngAfterViewInit(): void {
    this.messagesChanges$.pipe(
      startWith(0),
      takeUntilDestroyed(this.DestroyRef)
    ).subscribe(() => {
      setTimeout(() => {
        this.messagesContainer().nativeElement.scrollTop = this.messagesContainer().nativeElement.scrollHeight;
      });
    });
  }
}
