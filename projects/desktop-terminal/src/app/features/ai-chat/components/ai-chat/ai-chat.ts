import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  OnDestroy,
  OnInit,
  signal,
  ViewEncapsulation
} from '@angular/core';
import {TranslatorService} from "@terminal-core-lib/features/translations/services/translator.service";
import {AiChatService} from '../../services/ai-chat.service';
import {AiChatSuggestionsService} from '../../services/ai-chat-suggestions.service';
import {
  DisplayStatus,
  Message,
  MessageContent,
  MessageType,
  OutcomingMessage,
  TextMessageContent
} from "../../ai-chat.types";
import {
  BehaviorSubject,
  delay,
  map,
  Observable,
  shareReplay,
  take
} from 'rxjs';
import {TranslatorFn} from '@terminal-core-lib/features/translations/services/translator-service.types';
import {GuidGenerator} from '@terminal-core-lib/common/utils/guid-generator';
import {
  AsyncPipe,
  Location
} from '@angular/common';
import {AiChatContainer} from '../ai-chat-container/ai-chat-container';
import {AiChatUsageDisclaimer} from '../ai-chat-usage-disclaimer/ai-chat-usage-disclaimer';
import {AiChatStartNewConversationButton} from '../ai-chat-start-new-conversation-button/ai-chat-start-new-conversation-button';
import {AiChatMessageContainer} from '../ai-chat-message-container/ai-chat-message-container';
import {AiChatChatSuggestedMessageContainer} from '../ai-chat-chat-suggested-message-container/ai-chat-chat-suggested-message-container';
import {AiChatStatus} from '../ai-chat-status/ai-chat-status';
import {AiChatMessageInput} from '../ai-chat-message-input/ai-chat-message-input';
import {TranslocoDirective} from '@jsverse/transloco';

@Component({
  selector: 'atsd-ai-chat',
  imports: [
    AsyncPipe,
    AiChatContainer,
    AiChatUsageDisclaimer,
    AiChatStartNewConversationButton,
    AiChatMessageContainer,
    AiChatChatSuggestedMessageContainer,
    AiChatStatus,
    AiChatMessageInput,
    TranslocoDirective
  ],
  templateUrl: './ai-chat.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    AiChatService,
    AiChatSuggestionsService
  ]
})
export class AiChat implements OnInit, OnDestroy {
  displayMessages: Message<TextMessageContent>[] = [];

  readonly chatStatus$ = new BehaviorSubject<DisplayStatus | null>(null);

  suggestedMessages$!: Observable<TextMessageContent[]>;

  readonly atsDisabled = input(false);

  protected readonly showSuggestedMessages = signal(false);

  protected readonly canRestartConversation = signal(false);

  private readonly translatorService = inject(TranslatorService);

  private readonly aiChatService = inject(AiChatService);

  private readonly suggestionsService = inject(AiChatSuggestionsService);

  private readonly location = inject(Location);

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

  trackByMessage(index: number, item: Message<TextMessageContent>): string {
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

      this.showSuggestedMessages.set(false);
      this.canRestartConversation.set(false);

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
        this.canRestartConversation.set(true);
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

    this.showSuggestedMessages.set(true);
    this.canRestartConversation.set(false);
  }

  private createBotMessage<T extends MessageContent>(messageType: MessageType, content: T): Message<T> {
    return {
      date: new Date(),
      isMe: false,
      avatarUri: this.location.prepareExternalUrl('/assets/outline/ats-logo.svg'),
      messageType,
      content
    };
  }
}
