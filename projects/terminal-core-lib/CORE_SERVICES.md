Данный файл описывает предназначение некоторых ключевых сервисов, используемых в приложениях.

ApplicationStatusService
projects/terminal-core-lib/src/common/services/application-status.service.ts
Данный сервис позволяет определить активно ли сейчас приложение. Более актально для мобильных устройств, когда приложение может быть свернуто.
Чаще всего используется в периодических запросах обновления.

CacheService
projects/terminal-core-lib/src/common/services/cache.service.ts
Данный сервис позволяет кэшировать данные на определенное время с целью оптимизации производительности. 
Используется при HTTP запросах

DeviceNetworkService
projects/terminal-core-lib/src/common/services/device-network.service.ts
Данный сервис предоставляет данные о потери подключения к сети.

DeviceService
projects/terminal-core-lib/src/common/services/device.service.ts
Данный сервис предоставляет данные о типа устройства, на котором запущено приложение.

EventsBusService
projects/terminal-core-lib/src/common/services/events-bus.service.ts
Сервис для распространия/подписки событий внутри приложения.

GlobalLoadingIndicatorService
projects/terminal-core-lib/src/common/services/global-loading-indicator.service.ts
Данный сервис позволяет показать/скрыть глобальный loading индикатор.

NavigationStackService
projects/terminal-core-lib/src/common/services/navigation-stack.service.ts
Данный сервис позволяет отслеживать переключение пользователя между виджетами.
Актуально только для mobile приложений.

AppReleaseService
projects/terminal-core-lib/src/features/app-releases/services/app-release.service.ts
Данный сервис позволяет запрашивать данные о релизах приложения и отображать диалог об обновлении.


ApplicationMetaService
projects/terminal-core-lib/src/features/application-meta/application-meta.service.ts
Сервис управляет сохранение и загрузкой метаданных (lastResetTimestamp) о приложении. 

AccountService
projects/terminal-core-lib/src/features/client-info/services/account-service.ts
Сервис для получения данных о клиенте и его портфелях

AllPositionsService
projects/terminal-core-lib/src/features/client-info/services/all-positions.service.ts
Сервис для получения данных о позициях клиента

RisksService
projects/terminal-core-lib/src/features/client-info/services/risks.service.ts
Сервис для получения данных о текущих рисках клиента

TradesHistoryService
projects/terminal-core-lib/src/features/client-info/services/trade-history.service.ts
Сервис для получения данных о истории сделок клиента (все сделки, кроме текущей сессии)

DesktopDashboardContextService
projects/terminal-core-lib/src/features/dashboard/desktop/services/desktop-dashboard-context.service.ts
Сервис для получения и изменения данных для текущего выбранного дашборда (выбранный портфель, инструменты)
Только для desktop. Если универсального контекста использовать токен DASHBOARD_CONTEXT_SERVICE

DesktopManageDashboardsService
projects/terminal-core-lib/src/features/dashboard/desktop/services/desktop-manage-dashboards.service.ts
Сервис для управления дашбордами пользователя.
Актуально только для desktop.

DashboardTemplatesService
projects/terminal-core-lib/src/features/dashboard/services/dashboard-templates.service.ts
Сервис для загрузки текущих доступных шаблонов дашбордов.

SubscriptionsDataFeedService
projects/terminal-core-lib/src/features/data-subscriptions/services/subscriptions-data-feed.service.ts
Сервис для подписки на данные WebSocket

ErrorHandlerService
projects/terminal-core-lib/src/features/errors-handler/error-handler.service.ts
Сервия для логгирования http ошибок.

ExchangeRateService
projects/terminal-core-lib/src/features/exchange-rate/services/exchange-rate.service.ts
Сервия для получения данных о валютных парах

GraphQlService
projects/terminal-core-lib/src/features/graphql/services/graph-ql.service.ts
Сервия для запроса данных GraphQl (hyperion, news)

HelpService
projects/terminal-core-lib/src/features/help-docs/services/help.service.ts
Сервис для формирования URL на разделы справки

ApiTokenProviderService
projects/terminal-core-lib/src/features/http-requests/services/api-token-provider.service.ts
Сервия для получения JWT токена с целью его использования в http/ws запросах.

CandlesService
projects/terminal-core-lib/src/features/instruments/services/candles.service.ts
Сервис для получения данных по истории цен (свечам) для инструмента

InstrumentTradesService
projects/terminal-core-lib/src/features/instruments/services/instrument-trades.service.ts
Сервис для получения принтов сделок для инструмента

InstrumentsService
projects/terminal-core-lib/src/features/instruments/services/instruments.service.ts
Сервия для получения данных по конкретному инструменты или поиска инструментов

OrderbookService
projects/terminal-core-lib/src/features/instruments/services/orderbook.service.ts
Сервис для получения данных по стакану для инструмента

QuotesService
projects/terminal-core-lib/src/features/instruments/services/quotes.service.ts
Сервис для получения данных о котировках для инструмента

LocalStorageService
projects/terminal-core-lib/src/features/local-storage/local-storage.service.ts
Сервис для получения/сохранения данных в localStorage

LoggerService
projects/terminal-core-lib/src/features/logging/services/logger-service.ts
Сервис логгера

MarketService
projects/terminal-core-lib/src/features/market-config/market.service.ts
Сервис для чтения конфигурации рынка приложения

NetworkStatusService
projects/terminal-core-lib/src/features/network-indicator/services/network-status.service.ts
Серсия для получения статуса соединения с сервером, а также последнего времени отправки заявки

NewsService
projects/terminal-core-lib/src/features/news/services/news.service.ts
Сервис для загрузки новостей

ClientOrderCommandService
projects/terminal-core-lib/src/features/orders/services/client-order-command.service.ts
Сервис для выставления заявок

ConfirmableOrderCommandsService
projects/terminal-core-lib/src/features/orders/services/confirmable-order-commands.service.ts
Сервис для выставления заявок с подтверждением проведения маржинальной сделки

EvaluationService
projects/terminal-core-lib/src/features/orders/services/evaluation.service.ts
Сервис оценки заявки (комиссия, общая стоимость, кол-со лотов с плечем/без плеча и т.д.)

OrderDetailsService
projects/terminal-core-lib/src/features/orders/services/order-details.service.ts
Сервис для получения деталей по заявке пользователя

OrdersGroupService
projects/terminal-core-lib/src/features/orders/services/order-group.service.ts
Сервис для работы со связанными заявками

OrdersDialogService
projects/terminal-core-lib/src/features/orders/services/orders-dialog.service.ts
Сервис открытия/закрытия диалога выставления заявок

PortfoliosStoreFacade
projects/terminal-core-lib/src/features/portfolios/store/portfolios-store-facade.ts
Сервис возвращающий текущий список всех активных порфелей пользователя

PortfolioSubscriptionsService
projects/terminal-core-lib/src/features/portfolios/services/portfolio-subscriptions.ts
Сервис получения realtime данным по сущностям порфеля пользователя (саммари по порфелю, заявки, позиции, сделки)

PushNotificationsService
projects/terminal-core-lib/src/features/push-notifications/services/push-notifications.service.ts
Сервис для чтения push сообщений и управления подписками на них

RemoteStorageService
projects/terminal-core-lib/src/features/remote-storage/remote-storage.service.ts
Сервис для хранения данных пользователя на сервере

SideNotificationsService
projects/terminal-core-lib/src/features/side-notifications/services/side-notifications.service.ts
Сервис для отображения всплывающих сообщений (ошибки, статусы и т.д.)

TerminalSettingsService
projects/terminal-core-lib/src/features/terminal-settings/services/terminal-settings.service.ts
Сервис для чтения и обновления настроек терминала

ThemeService
projects/terminal-core-lib/src/features/themes/services/theme.service.ts
Сервис для чтения текущей конфигурации цветовой темы приложения

TimezoneConverterService
projects/terminal-core-lib/src/features/timezones/services/timezone-converter.service.ts
Сервис для конвертации дат и времени в соотвествии с выбранными настройками терминала

TranslatorService
projects/terminal-core-lib/src/features/translations/services/translator.service.ts
Сервис для работы с переводами

UrgentNotificationsService
projects/terminal-core-lib/src/features/urgent-notifications/services/urgent-notifications.service.ts
Сервис для получения важных новостей от брокера

WatchlistCollectionService
projects/terminal-core-lib/src/features/watchlist/services/watchlist-collection.service.ts
Сервис для получения у управления watchlists

WidgetLocalStateService
projects/terminal-core-lib/src/features/widget-local-state/widget-local-state.service.ts
Сервис для чтения и записи локального состояния виджета

WidgetSettingsService
projects/terminal-core-lib/src/features/widget-settings/services/widget-settings.service.ts
Сервис для чтения и записи текущих настроек виджета

WidgetSharedDataService
projects/terminal-core-lib/src/features/widgets-communication/services/widget-shared-data.service.ts
Сервис для обмена данными между виджетами

WidgetsMetaService
projects/terminal-core-lib/src/features/widgets-gallery/services/widgets-meta.service.ts
Сервис для чтения метаданных о виджетах (данные для отображения виджетов в галлереи и дашборде)








