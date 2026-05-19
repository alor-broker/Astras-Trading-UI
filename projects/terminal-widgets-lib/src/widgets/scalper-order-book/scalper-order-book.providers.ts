import {Provider} from '@angular/core';
import {ScalperHotKeyCommandService} from '@terminal-widgets-lib/widgets/scalper-order-book/services/scalper-hot-key-command.service';
import {ScalperSharedSettingsService} from '@terminal-widgets-lib/widgets/scalper-order-book/services/scalper-shared-settings.service';
import {ScalperOrderBookSettingsWriteService} from '@terminal-widgets-lib/widgets/scalper-order-book/services/scalper-order-book-settings-write.service';
import {ScalperOrderBookSettingsReadService} from '@terminal-widgets-lib/widgets/scalper-order-book/services/scalper-order-book-settings-read.service';
import {ScalperOrderBookInstantTranslatableNotificationsService} from '@terminal-widgets-lib/widgets/scalper-order-book/services/scalper-order-book-instant-translatable-notifications.service';
import {ScalperCommandProcessorService} from '@terminal-widgets-lib/widgets/scalper-order-book/services/scalper-command-processor.service';
import {provideCommands} from '@terminal-widgets-lib/widgets/scalper-order-book/commands/commands.providers';
import {ScalperOrderBookDataProvider} from '@terminal-widgets-lib/widgets/scalper-order-book/services/scalper-order-book-data-provider.service';
import {TradeClustersService} from '@terminal-widgets-lib/widgets/scalper-order-book/services/trade-clusters.service';

export function provideScalperOrderBookSharedServices(): Provider[] {
  return [
    ScalperOrderBookDataProvider,
    ScalperHotKeyCommandService,
    ScalperSharedSettingsService,
    ScalperOrderBookSettingsWriteService,
    ScalperOrderBookSettingsReadService,
    ScalperOrderBookInstantTranslatableNotificationsService,
    ScalperCommandProcessorService,
    TradeClustersService,
    provideCommands()
  ];
}
