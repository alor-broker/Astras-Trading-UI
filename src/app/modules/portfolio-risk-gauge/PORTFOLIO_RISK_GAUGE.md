# Виджет Gauge риска портфеля

Документ описывает, какие данные использует виджет, как считается состояние и почему красная зона находится справа: слева показывается безопасное состояние, справа - рост риска.

## Общая логика отображения

Виджет показывает один итоговый риск портфеля. Для обычных портфелей используется НПР, для срочного контура - запас свободных средств относительно ГО/оперативного риска, для ЕДП - худшая из двух компонент.

Внутренний числовой показатель для стрелки называется `gaugeValuePercent`:

```text
gaugeValuePercent = clamp(100 - reserveRatio * 100, 0, 100)
```

То есть чем меньше запас, тем правее стрелка:

```text
0-50%   левая зелёная зона
50-80%  жёлтая зона
80-100% правая красная зона
```

Если по компоненте нет значимой нагрузки, стрелка остаётся слева. Если наступил аварийный режим, стрелка принудительно ставится вправо.

Данные обновляются динамически через существующие WebSocket-подписки:

```text
RisksGetAndSubscribe
SpectraRisksGetAndSubscribe
```

## Портфели с расчётом по НПР

Источник данных:

```text
/md/v2/Clients/{exchange}/{portfolio}/risk
```

Используемые поля:

```text
riskCoverageRatioOne
riskCoverageRatioTwo
initialMargin
riskStatus
```

Русские названия полей из API:

| Поле API | Название / смысл |
| --- | --- |
| `riskCoverageRatioOne` | НПР1 |
| `riskCoverageRatioTwo` | НПР2 |
| `initialMargin` | Начальная маржа |
| `minimalMargin` | Минимальная маржа |
| `portfolioLiquidationValue` | Ликвидационная стоимость портфеля |
| `riskStatus` | Статус риска |

Основной запас:

```text
nprReserveRatio = riskCoverageRatioOne / initialMargin
```

Если `initialMargin <= 0`, маржинальной нагрузки нет. Виджет показывает спокойное состояние.

Состояния:

```text
FORCED_CLOSE_RISK:
riskStatus = ToClose
или riskCoverageRatioTwo <= 0

RESTRICTED:
riskStatus = Demand
или riskCoverageRatioOne <= 0

RED:
riskStatus = Ok
и 0 < nprReserveRatio < 0.20

YELLOW:
riskStatus = Ok
и 0.20 <= nprReserveRatio < 0.50

GREEN:
riskStatus = Ok
и nprReserveRatio >= 0.50
```

Важно: `Demand` и `ToClose` не являются обычными жёлтой/красной зонами. Это аварийные состояния после нарушения нормального запаса.

## Портфели срочного контура

Источник данных:

```text
/md/v2/Clients/{exchange}/{portfolio}/fortsrisk
```

Используемые поля:

```text
moneyFree
moneyBlocked
posRisk
```

Русские названия полей из API:

| Поле API | Название / смысл |
| --- | --- |
| `moneyFree` | Свободные средства |
| `moneyBlocked` | Средства, заблокированные под ГО |
| `moneyAmount` | Общее количество средств и залогов |
| `moneyPledgeAmount` | Сумма залогов |
| `vmInterCl` | Вариационная маржа в промежуточный клиринг |
| `vmCurrentPositions` | Вариационная маржа по текущим позициям |
| `varMargin` | Итоговая вариационная маржа |
| `indicativeVarMargin` | Индикативная вариационная маржа |
| `posRisk` | Оперативный риск |
| `isLimitsSet` | Наличие денежных и залоговых лимитов |

База риска:

```text
riskBase = max(abs(moneyBlocked), abs(posRisk))
```

Если `riskBase <= 0`, значит нет заблокированных средств под ГО и нет оперативного риска. Виджет показывает спокойное состояние с текстом "Нет нагрузки по ГО".

Основной запас:

```text
fortsReserveRatio = moneyFree / riskBase
```

Состояния:

```text
CRITICAL:
moneyFree <= 0

RED:
0 < fortsReserveRatio < 0.20

YELLOW:
0.20 <= fortsReserveRatio < 0.50

GREEN:
fortsReserveRatio >= 0.50
```

Здесь `moneyFree <= 0` считается аварийным состоянием, а не просто красной зоной.

## ЕДП-портфель

ЕДП объединяет фондовый и срочный контуры, поэтому виджет показывает один итоговый риск.

Компоненты:

```text
edpNprState = состояние по /risk
edpFortsState = состояние по /fortsrisk
```

Итоговое состояние:

```text
edpState = худшее состояние из edpNprState и edpFortsState
```

Порядок тяжести:

```text
GREEN < YELLOW < RED < RESTRICTED < CRITICAL < FORCED_CLOSE_RISK
```

Если для ЕДП не пришла одна из компонент, виджет показывает `NO_DATA`. Это сделано намеренно: безопасная доступная часть не должна маскировать неизвестную часть объединённого риска.

## Нет данных

Состояние `NO_DATA` используется, когда виджет не может корректно посчитать риск:

```text
для ЕДП нет одной из двух компонент;
подписка вернула ошибку;
данные ещё не пришли.
```

В этом состоянии стрелка не отображается.

## Отображаемые подписи

Основные состояния:

```text
GREEN              Спокойно
YELLOW             Внимание
RED                Малый запас
RESTRICTED         Ограничение
CRITICAL           Критично
FORCED_CLOSE_RISK  Автозакрытие возможно
NO_DATA            Нет данных
```

Для ЕДП дополнительно показываются технические компоненты:

```text
НПР
ГО / запас
```
