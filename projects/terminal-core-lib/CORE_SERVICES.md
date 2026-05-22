# Core services

Этот файл помогает выбрать существующий сервис перед созданием нового. Если задача относится к общей функциональности терминала, сначала проверь этот каталог.

## Как пользоваться

- Ищи сервис по предметной области.
- Используй существующий сервис, если его назначение покрывает задачу.
- Создавай новый сервис только если ни один существующий сервис не подходит по ответственности.
- Если сервис нужен нескольким виджетам или приложениям, он должен находиться в `terminal-core-lib`, а не внутри конкретного виджета.

## Приложение и инфраструктура

| Сервис | Путь | Назначение | Когда использовать |
| --- | --- | --- | --- |
| `ApplicationStatusService` | `projects/terminal-core-lib/src/common/services/application-status.service.ts` | Определяет, активно ли приложение | Для периодических обновлений, особенно на мобильных устройствах, когда приложение может быть свернуто |
| `ApplicationMetaService` | `projects/terminal-core-lib/src/features/application-meta/application-meta.service.ts` | Управляет сохранением и загрузкой метаданных приложения, например `lastResetTimestamp` | Когда нужно читать или сохранять служебные metadata приложения |
| `AppReleaseService` | `projects/terminal-core-lib/src/features/app-releases/services/app-release.service.ts` | Загружает данные о релизах и помогает показывать диалог обновления | Когда функциональность связана с версиями и обновлением приложения |
| `DeviceService` | `projects/terminal-core-lib/src/common/services/device.service.ts` | Предоставляет данные о типе устройства | Когда логика зависит от desktop/mobile устройства |
| `GlobalLoadingIndicatorService` | `projects/terminal-core-lib/src/common/services/global-loading-indicator.service.ts` | Показывает и скрывает глобальный loading indicator | Для глобальных операций загрузки |
| `HelpService` | `projects/terminal-core-lib/src/features/help-docs/services/help.service.ts` | Формирует URL на разделы справки | Когда нужен переход или ссылка на справочную документацию |
| `LoggerService` | `projects/terminal-core-lib/src/features/logging/services/logger-service.ts` | Общий logger | Для логирования событий и ошибок |
| `MarketService` | `projects/terminal-core-lib/src/features/market-config/market.service.ts` | Читает конфигурацию рынка приложения | Когда логика зависит от market configuration |
| `TimezoneConverterService` | `projects/terminal-core-lib/src/features/timezones/services/timezone-converter.service.ts` | Конвертирует даты и время по настройкам терминала | Для отображения или расчета времени с учетом настроек пользователя |

## Сеть, HTTP, GraphQL и хранение

| Сервис | Путь | Назначение | Когда использовать |
| --- | --- | --- | --- |
| `ApiTokenProviderService` | `projects/terminal-core-lib/src/features/http-requests/services/api-token-provider.service.ts` | Получает JWT token для HTTP и WebSocket запросов | Когда запросу нужен авторизационный token |
| `CacheService` | `projects/terminal-core-lib/src/common/services/cache.service.ts` | Кэширует данные на заданное время | Для оптимизации HTTP запросов |
| `DeviceNetworkService` | `projects/terminal-core-lib/src/common/services/device-network.service.ts` | Предоставляет данные о потере подключения к сети | Когда нужно учитывать состояние сети устройства |
| `ErrorHandlerService` | `projects/terminal-core-lib/src/features/errors-handler/error-handler.service.ts` | Логирует HTTP ошибки | Для централизованной обработки ошибок запросов |
| `GraphQlService` | `projects/terminal-core-lib/src/features/graphql/services/graph-ql.service.ts` | Выполняет GraphQL запросы, включая hyperion и news | Когда источник данных доступен через GraphQL |
| `LocalStorageService` | `projects/terminal-core-lib/src/features/local-storage/local-storage.service.ts` | Читает и сохраняет данные в `localStorage` | Для локального хранения данных пользователя |
| `NetworkStatusService` | `projects/terminal-core-lib/src/features/network-indicator/services/network-status.service.ts` | Предоставляет статус соединения с сервером и время последней отправки заявки | Для индикаторов и логики, зависящей от server connection |
| `RemoteStorageService` | `projects/terminal-core-lib/src/features/remote-storage/remote-storage.service.ts` | Хранит пользовательские данные на сервере | Для server-side хранения пользовательских настроек или состояния |

## Клиент, портфели и риски

| Сервис | Путь | Назначение | Когда использовать |
| --- | --- | --- | --- |
| `AccountService` | `projects/terminal-core-lib/src/features/client-info/services/account-service.ts` | Получает данные о клиенте и его портфелях | Когда нужны account/client данные |
| `AllPositionsService` | `projects/terminal-core-lib/src/features/client-info/services/all-positions.service.ts` | Получает данные о позициях клиента | Когда нужны позиции по клиенту |
| `PortfoliosStoreFacade` | `projects/terminal-core-lib/src/features/portfolios/store/portfolios-store-facade.ts` | Возвращает список активных портфелей пользователя | Когда нужен текущий набор портфелей |
| `PortfolioSubscriptionsService` | `projects/terminal-core-lib/src/features/portfolios/services/portfolio-subscriptions.ts` | Получает realtime данные по сущностям портфеля: summary, заявки, позиции, сделки | Когда нужны live updates по портфелю |
| `RisksService` | `projects/terminal-core-lib/src/features/client-info/services/risks.service.ts` | Получает текущие риски клиента | Когда UI или логика зависит от risk data |
| `TradesHistoryService` | `projects/terminal-core-lib/src/features/client-info/services/trade-history.service.ts` | Получает историю сделок клиента, кроме текущей сессии | Когда нужна historical trades data |

## Дашборды и виджеты

| Сервис | Путь | Назначение | Когда использовать |
| --- | --- | --- | --- |
| `DashboardTemplatesService` | `projects/terminal-core-lib/src/features/dashboard/services/dashboard-templates.service.ts` | Загружает доступные шаблоны дашбордов | Когда нужен список или данные dashboard templates |
| `DesktopDashboardContextService` | `projects/terminal-core-lib/src/features/dashboard/desktop/services/desktop-dashboard-context.service.ts` | Получает и изменяет данные текущего desktop дашборда: выбранный портфель, инструменты | Только для desktop. Для универсального контекста используй token `DASHBOARD_CONTEXT_SERVICE` |
| `DesktopManageDashboardsService` | `projects/terminal-core-lib/src/features/dashboard/desktop/services/desktop-manage-dashboards.service.ts` | Управляет дашбордами пользователя | Только для desktop dashboard management |
| `NavigationStackService` | `projects/terminal-core-lib/src/common/services/navigation-stack.service.ts` | Отслеживает переключение пользователя между виджетами | Только для mobile приложений |
| `WidgetLocalStateService` | `projects/terminal-core-lib/src/features/widget-local-state/widget-local-state.service.ts` | Читает и записывает локальное состояние виджета | Когда состояние виджета не является пользовательскими настройками |
| `WidgetSettingsService` | `projects/terminal-core-lib/src/features/widget-settings/services/widget-settings.service.ts` | Читает и записывает текущие настройки виджета | Когда нужно сохранять настройки виджета |
| `WidgetSharedDataService` | `projects/terminal-core-lib/src/features/widgets-communication/services/widget-shared-data.service.ts` | Обменивается данными между виджетами | Когда виджеты должны передавать друг другу данные |
| `WidgetsMetaService` | `projects/terminal-core-lib/src/features/widgets-gallery/services/widgets-meta.service.ts` | Читает metadata виджетов для галереи и дашборда | Когда нужна информация о доступности или представлении виджетов |

## Рыночные данные и инструменты

| Сервис | Путь | Назначение | Когда использовать |
| --- | --- | --- | --- |
| `CandlesService` | `projects/terminal-core-lib/src/features/instruments/services/candles.service.ts` | Получает историю цен, свечи инструмента | Для графиков и исторических цен |
| `ExchangeRateService` | `projects/terminal-core-lib/src/features/exchange-rate/services/exchange-rate.service.ts` | Получает данные о валютных парах | Когда нужны exchange rates |
| `InstrumentTradesService` | `projects/terminal-core-lib/src/features/instruments/services/instrument-trades.service.ts` | Получает принты сделок по инструменту | Для отображения сделок по инструменту |
| `InstrumentsService` | `projects/terminal-core-lib/src/features/instruments/services/instruments.service.ts` | Получает данные по инструменту или выполняет поиск инструментов | Когда нужно найти инструмент или получить его details |
| `OrderbookService` | `projects/terminal-core-lib/src/features/instruments/services/orderbook.service.ts` | Получает стакан инструмента | Для order book UI и расчетов по стакану |
| `QuotesService` | `projects/terminal-core-lib/src/features/instruments/services/quotes.service.ts` | Получает котировки инструмента | Когда нужны текущие quotes |
| `SubscriptionsDataFeedService` | `projects/terminal-core-lib/src/features/data-subscriptions/services/subscriptions-data-feed.service.ts` | Подписывает на WebSocket данные | Для realtime market data subscriptions |

## Заявки и торговые операции

| Сервис | Путь | Назначение | Когда использовать |
| --- | --- | --- | --- |
| `ClientOrderCommandService` | `projects/terminal-core-lib/src/features/orders/services/client-order-command.service.ts` | Выставляет заявки | Для базовой отправки order commands |
| `ConfirmableOrderCommandsService` | `projects/terminal-core-lib/src/features/orders/services/confirmable-order-commands.service.ts` | Выставляет заявки с подтверждением маржинальной сделки | Когда перед заявкой требуется confirmation flow |
| `EvaluationService` | `projects/terminal-core-lib/src/features/orders/services/evaluation.service.ts` | Оценивает заявку: комиссия, стоимость, количество лотов с плечом и без плеча | Для предварительного расчета заявки |
| `OrderDetailsService` | `projects/terminal-core-lib/src/features/orders/services/order-details.service.ts` | Получает детали заявки пользователя | Когда нужен подробный order details view |
| `OrdersDialogService` | `projects/terminal-core-lib/src/features/orders/services/orders-dialog.service.ts` | Открывает и закрывает диалог выставления заявок | Для UI сценариев создания заявки через dialog |
| `OrdersGroupService` | `projects/terminal-core-lib/src/features/orders/services/order-group.service.ts` | Работает со связанными заявками | Когда логика касается grouped orders |

## Новости, уведомления и push

| Сервис | Путь | Назначение | Когда использовать |
| --- | --- | --- | --- |
| `NewsService` | `projects/terminal-core-lib/src/features/news/services/news.service.ts` | Загружает новости | Когда нужны news data |
| `PushNotificationsService` | `projects/terminal-core-lib/src/features/push-notifications/services/push-notifications.service.ts` | Читает push messages и управляет подписками на них | Для push notification flows |
| `SideNotificationsService` | `projects/terminal-core-lib/src/features/side-notifications/services/side-notifications.service.ts` | Показывает всплывающие сообщения: ошибки, статусы и другое | Для side/toast notifications |
| `UrgentNotificationsService` | `projects/terminal-core-lib/src/features/urgent-notifications/services/urgent-notifications.service.ts` | Получает важные новости от брокера | Для urgent broker messages |

## Настройки, темы, переводы и watchlists

| Сервис | Путь | Назначение | Когда использовать |
| --- | --- | --- | --- |
| `TerminalSettingsService` | `projects/terminal-core-lib/src/features/terminal-settings/services/terminal-settings.service.ts` | Читает и обновляет настройки терминала | Когда нужна terminal settings state |
| `ThemeService` | `projects/terminal-core-lib/src/features/themes/services/theme.service.ts` | Читает текущую конфигурацию цветовой темы приложения | Когда UI зависит от active theme |
| `TranslatorService` | `projects/terminal-core-lib/src/features/translations/services/translator.service.ts` | Работает с переводами | Для переводов в классах компонентов и сервисов |
| `WatchlistCollectionService` | `projects/terminal-core-lib/src/features/watchlist/services/watchlist-collection.service.ts` | Получает и управляет watchlists | Когда нужна работа со списками наблюдения |
