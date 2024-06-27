import {
  Component,
  Input,
  OnDestroy,
  OnInit,
} from '@angular/core';
import {
  Message,
  MessageContent,
  MessageType,
  TextMessageContent
} from "../../models/messages-display.model";
import { OutcomingMessage } from "../message-input/message-input.component";
import {
  TranslatorFn,
  TranslatorService
} from "../../../../shared/services/translator.service";
import {
  BehaviorSubject,
  delay,
  Observable,
  shareReplay,
  take
} from "rxjs";
import { DisplayStatus } from "../chat-status/chat-status.component";
import { AiChatService } from "../../services/ai-chat.service";
import { map } from "rxjs/operators";

@Component({
  selector: 'ats-ai-chat',
  templateUrl: './ai-chat.component.html',
  styleUrls: ['./ai-chat.component.less']
})
export class AiChatComponent implements OnInit, OnDestroy {
  displayMessages: Message<any>[] = [];

  readonly chatStatus$ = new BehaviorSubject<DisplayStatus | null>(null);
  suggestedMessages$!: Observable<TextMessageContent[]>;
  showSuggestedMessages = false;
  canRestartConversation = false;
  private translator$!: Observable<TranslatorFn>;

  @Input()
  atsDisabled = false;

  constructor(
    private readonly translatorService: TranslatorService,
    private readonly aiChatService: AiChatService
  ) {
  }

  ngOnDestroy(): void {
    this.chatStatus$.complete();
  }

  ngOnInit(): void {
    this.translator$ = this.translatorService.getTranslator('ai-chat').pipe(
      shareReplay({ bufferSize: 1, refCount: true })
    );

    this.suggestedMessages$ = this.aiChatService.getSuggestions().pipe(
      map(r => {
        if (r == null) {
          return [];
        }

        return r.suggestions
          .sort((a, b) => a.length - b.length)
          .map(s => ({ text: s }));
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

      this.aiChatService.sendMessage({
        text: message.text
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
    if(this.atsDisabled) {
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
      : 1000;

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
