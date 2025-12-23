import { Component, OnDestroy, OnInit, input, inject } from '@angular/core';
import {Message, MessageContent, MessageType, TextMessageContent} from "../../models/messages-display.model";
import {MessageInputComponent, OutcomingMessage} from "../message-input/message-input.component";
import {TranslatorFn, TranslatorService} from "../../../../shared/services/translator.service";
import {BehaviorSubject, delay, Observable, shareReplay, take} from "rxjs";
import {ChatStatusComponent, DisplayStatus} from "../chat-status/chat-status.component";
import {AiChatService} from "../../services/ai-chat.service";
import {map} from "rxjs/operators";
import {GuidGenerator} from "../../../../shared/utils/guid";
import {SuggestionsService} from "../../services/suggestions.service";
import {ChatContainerComponent} from '../chat-container/chat-container.component';
import {UsageDisclaimerComponent} from '../usage-disclaimer/usage-disclaimer.component';
import {
  StartNewConversationButtonComponent
} from '../start-new-conversation-button/start-new-conversation-button.component';
import {ChatMessageContainerComponent} from '../chat-message-container/chat-message-container.component';
import {
  ChatSuggestedMessageContainerComponent
} from '../chat-suggested-message-container/chat-suggested-message-container.component';
import {TranslocoDirective} from '@jsverse/transloco';
import {AsyncPipe} from '@angular/common';

@Component({
  selector: 'ats-ai-chat',
  templateUrl: './ai-chat.component.html',
  styleUrls: ['./ai-chat.component.less'],
  imports: [
    ChatContainerComponent,
    UsageDisclaimerComponent,
    StartNewConversationButtonComponent,
    ChatMessageContainerComponent,
    ChatSuggestedMessageContainerComponent,
    ChatStatusComponent,
    TranslocoDirective,
    MessageInputComponent,
    AsyncPipe
  ]
})
export class AiChatComponent implements OnInit, OnDestroy {
  private readonly translatorService = inject(TranslatorService);
  private readonly aiChatService = inject(AiChatService);
  private readonly suggestionsService = inject(SuggestionsService);

  displayMessages: Message<any>[] = [];

  readonly chatStatus$ = new BehaviorSubject<DisplayStatus | null>(null);
  suggestedMessages$!: Observable<TextMessageContent[]>;
  showSuggestedMessages = false;
  canRestartConversation = false;

  readonly atsDisabled = input(false);

  private translator$!: Observable<TranslatorFn>;
  private threadId: string | null = null;

  ngOnDestroy(): void {
    this.chatStatus$.complete();
  }

  ngOnInit(): void {
    this.translator$ = this.translatorService.getTranslator('ai-chat').pipe(
      shareReplay({bufferSize: 1, refCount: true})
    );

    this.suggestedMessages$ = this.suggestionsService.getSuggestions().pipe(
      map(r => {
        if (r == null) {
          return [];
        }

        return r
          .sort((a, b) => a.length - b.length)
          .map(s => ({text: s}));
      })
    );

    this.startNewConversation();
  }

  trackByMessage(index: number, item: Message<any>): string {
    return item.date.getTime().toString();
  }

  sendMessage(message: OutcomingMessage): void {
    this.translator$.pipe(
      take(1)
    ).subscribe(translator => {
      this.displayMessages.push({
        date: new Date(),
        isMe: true,
        messageType: MessageType.Text,
        content: {
          text: message.text
        } as TextMessageContent
      });

      this.chatStatus$.next({
        text: translator(['messages', 'botThinking'])
      });

      this.showSuggestedMessages = false;
      this.canRestartConversation = false;

      this.threadId = this.threadId ?? GuidGenerator.newGuid();

      this.aiChatService.sendMessage({
        text: message.text,
        threadId: this.threadId
      }).pipe(
        take(1)
      ).subscribe(response => {
        if (!response) {
          this.displayMessages.push(this.createBotMessage<TextMessageContent>(
            MessageType.Text,
            {
              text: translator(['messages', 'requestError'])
            }
          ));
        } else {
          this.displayMessages.push(this.createBotMessage<TextMessageContent>(
            MessageType.Text,
            {
              text: response.text
            }
          ));
        }

        this.chatStatus$.next(null);
        this.canRestartConversation = true;
      });
    });
  }

  useSuggestedMessage(content: TextMessageContent): void {
    if (this.atsDisabled()) {
      return;
    }

    this.sendMessage({
      text: content.text
    });
  }

  startNewConversation(): void {
    // need delay on application loading because of language switching
    // without delay default language message will be displayed
    const greetingDelay = this.displayMessages.length > 0
      ? 0
      : 3000;

    this.threadId = GuidGenerator.newGuid();
    this.displayMessages = [];
    this.chatStatus$.next(null);

    this.translator$.pipe(
      delay(greetingDelay),
      take(1)
    ).subscribe(translator => {
      this.displayMessages.push(this.createBotMessage<TextMessageContent>(
        MessageType.Text,
        {
          text: translator(['messages', 'botGreeting'])
        }
      ));
    });

    this.showSuggestedMessages = true;
    this.canRestartConversation = false;
  }

  private createBotMessage<T extends MessageContent>(messageType: MessageType, content: T): Message<T> {
    return {
      date: new Date(),
      isMe: false,
      avatarUri: '/assets/custom_icons/outline/ats-logo.svg',
      messageType,
      content
    };
  }
}
