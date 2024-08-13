import {
  AfterViewInit,
  Component,
  ContentChildren,
  DestroyRef,
  ElementRef,
  QueryList,
  ViewChild
} from '@angular/core';
import { ChatMessageContainerComponent } from "../chat-message-container/chat-message-container.component";
import {
  startWith
} from "rxjs/operators";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";

@Component({
  selector: 'ats-chat-container',
  templateUrl: './chat-container.component.html',
  styleUrls: ['./chat-container.component.less']
})
export class ChatContainerComponent implements AfterViewInit {
  @ViewChild('messagesContainer')
  messagesContainer!: ElementRef<HTMLDivElement>;

  @ContentChildren(ChatMessageContainerComponent)
  messages!: QueryList<ChatMessageContainerComponent>;

  constructor(private readonly DestroyRef: DestroyRef) {
  }

  ngAfterViewInit(): void {
    this.messages.changes.pipe(
      startWith(0),
      takeUntilDestroyed(this.DestroyRef)
    ).subscribe(() => {
      setTimeout(() => {
        this.messagesContainer.nativeElement.scrollTop = this.messagesContainer.nativeElement.scrollHeight;
      });
    });
  }
}
