import { AfterViewInit, Component, contentChildren, DestroyRef, ElementRef, viewChild, inject } from '@angular/core';
import {ChatMessageContainerComponent} from "../chat-message-container/chat-message-container.component";
import {startWith} from "rxjs/operators";
import {takeUntilDestroyed, toObservable} from "@angular/core/rxjs-interop";

@Component({
  selector: 'ats-chat-container',
  templateUrl: './chat-container.component.html',
  styleUrls: ['./chat-container.component.less']
})
export class ChatContainerComponent implements AfterViewInit {
  private readonly DestroyRef = inject(DestroyRef);

  readonly messagesContainer = viewChild.required<ElementRef<HTMLDivElement>>('messagesContainer');

  readonly messages = contentChildren(ChatMessageContainerComponent);
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
