import {
  Component,
  OnDestroy,
  OnInit
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
  readonly displayMessages: Message<any>[] = [];

  readonly chatStatus$ = new BehaviorSubject<DisplayStatus | null>(null);
  messageSamples$!: Observable<TextMessageContent[]>;
  private translator$!: Observable<TranslatorFn>;

  showSamples = true;

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

    this.translator$.pipe(
      take(1)
    ).subscribe(translator => {
      this.displayMessages.push(this.createBotMessage<TextMessageContent>(
        MessageType.Text,
        {
          text: translator(['messages', 'botGreeting'])
        }
      ));
    });

    this.messageSamples$ = this.aiChatService.getSamples().pipe(
      map(r => {
        if (r == null) {
          return [];
        }

        return r.samples
          .sort((a, b) => a.text.length - b.text.length);
      })
    );
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

      this.showSamples = false;

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
      });
    });
  }

  useSampleMessage(content: TextMessageContent): void {
    this.sendMessage({
      text: content.text
    });
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
