# testing-lib

`testing-lib` — внутренняя библиотека для тестов: переиспользуемые фикстуры, моки, провайдеры, билдеры и хелперы для всех проектов терминала. Здесь же зафиксированы **правила написания тестов**, обязательные и для людей, и для AI агентов.

## Назначение

- Хранить переиспользуемый тестовый код: фикстуры данных, моки сервисов, общие провайдеры `TestBed`, билдеры объектов, хелперы.
- Быть единым источником правды по тому, **как** писать тесты в этом репозитории.

`testing-lib` используется только в тестовом окружении (`*.spec.ts`, `tsconfig.spec.json`) и **не должна попадать в production-сборку** приложений. Не импортируй её код из `*.ts` приложений и библиотек.

## Стек тестирования

- Тест-раннер: **Vitest** (builder `@angular/build:unit-test`, `vitest/globals`).
- Angular: **`TestBed`** для всего, что требует DI (сервисы, компоненты, директивы, пайпы с зависимостями).
- Запуск: `pnpm test` (всё) или `pnpm test:desktop` / `test:mobile` / `test:admin` / `test:core-lib` / `test:widgets-lib`. В CI тесты должны проходить в режиме `--no-watch`.

## Правила

### 1. Инструментарий

1. Тесты пишем только на **Vitest API** + Angular **`TestBed`**. Jasmine API запрещён: используй `vi.fn()` (не `jasmine.createSpy`), `vi.mock()`, `expect.objectContaining()` и т.д.
2. `ng-mocks` **не используем**. Заглушки задаём через `TestBed` (`provide … useValue`, `overrideComponent`) либо изолируем логику так, чтобы тяжёлый UI вообще не участвовал в unit-тесте.
3. Файл теста — `*.spec.ts` рядом с тестируемым файлом; создаётся вручную и осознанно.
4. Корневой `describe` — имя тестируемой сущности (`describe('MathHelper')`, `describe('EnvironmentService')`). Вложенный `describe` — метод или сценарий.

### 2. Что и в каком порядке тестировать

5. **Приоритет 1 — pure-логика:** `utils/*.helper.ts`, пайпы, чистые функции. Тестируем прямым вызовом, без `TestBed`. Обязательны: happy-path, граничные значения, некорректный / `null` / `undefined` вход.
6. **Приоритет 2 — сервисы:** через `TestBed`; зависимости — заглушки (`provide … useValue: { method: vi.fn() }`). HTTP — только через `HttpTestingController` (`provideHttpClientTesting`), реальной сети в тестах нет.
7. **Приоритет 3 — простые компоненты.** Компонент тестируем, только если он **простой** и тест **детерминирован**. Простой компонент:
   - не работает со сложной RxJS-логикой (несколько потоков, таймеры, race, тонкий тайминг подписок);
   - не имеет сложной анимации;
   - не требует сложного сетапа входных данных (`input()`).

   Главный фильтр — тест должен отрабатывать **одинаково и без зависаний** при каждом запуске. Если детерминированный тест без зависаний написать нельзя, **тесты для такого компонента не пишем вообще** — это осознанный выбор, а не пропуск.
8. NgRx (reducers / effects / селекторы / streams) тестируем позже; правила будут добавлены в этот README отдельно.

### 3. Переиспользуемый код → в `testing-lib`

9. Наполняем `testing-lib` **по факту переиспользования**: код живёт локально в `*.spec.ts`, и как только он нужен во втором месте — выносится сюда. Никакого наполнения «про запас».
10. Дублировать фикстуры, моки и билдеры между spec-файлами нельзя — общее выносим в `testing-lib`.
11. Импорт из библиотеки — через alias `@testing-lib/*`.
12. Для создания тестовых объектов предпочитай **builder-функции с дефолтами и overrides** (`createInstrument(overrides?)`), а не «толстые» статические константы.

### 4. Структура и читаемость теста

13. Структура **AAA** (Arrange → Act → Assert). Блоки разделяй пустой строкой; комментарии `// Arrange` необязательны.
14. `it('should …')` описывает одно поведение. Несколько `expect` допустимы, если они проверяют один сценарий.
15. Общий arrange выноси в `beforeEach`. Состояние не должно утекать между тестами.
16. Магические значения именуй (`const override = 'https://override.example'`), а не повторяй строковыми литералами.

### 5. Детерминизм

17. Тест не зависит от реального времени, сети, локали ОС и случайности. Время — `vi.useFakeTimers()`; «случайные» данные — фиксированные или из хелперов `testing-lib`.
18. `localStorage` / `sessionStorage` / прочие глобалы — всегда через мок-провайдер, не реальный браузерный API.
19. Тест должен стабильно проходить при многократном и параллельном запуске.

### 6. Асинхронность и RxJS

20. Каждый асинхронный тест обязан дождаться завершения (`await`, `fakeAsync`/`flush`, либо проверка внутри подписки). «Висящих» подписок и незавершённых промисов быть не должно.
21. Простое значение из `Observable` проверяй через `firstValueFrom(...)`; для конечных потоков используй `take(1)`.
22. Логику с таймерами/задержками RxJS тестируй через `fakeAsync` + `tick()`. Сложное потоковое тайминговое поведение — через `TestScheduler` (marble).

### 7. Моки и проверки

23. Мок возвращает минимально необходимое для сценария.
24. Проверяй и результат, **и** факт/аргументы вызова зависимостей, когда вызов — часть контракта (`expect(spy).toHaveBeenCalledWith('debug.apiUrl')`).
25. Моки пересоздавай в `beforeEach`, чтобы счётчики и реализации не текли между тестами.

### 8. Ценность тестов и coverage

26. **Тестируем осознанные сценарии, а не покрытие кода.** Каждый тест проверяет конкретное поведение, контракт или граничный случай, значимый для домена. Прежде чем писать тест, сформулируй: *какую регрессию он поймает*. Если ответа нет — тест не нужен.
27. Не пиши тесты ради процента coverage, ради «зелёной» строки в отчёте или ради тривиального кода (геттеры-проброс, реэкспорты, конфиги без логики). Один тест, ловящий реальную ошибку, ценнее десяти, дублирующих реализацию.
28. Тест проверяет **поведение и контракт**, а не детали реализации: при рефакторинге без смены поведения тесты не должны массово «краснеть».
29. Coverage собираем как ориентир, **без блокирующих порогов** в CI. Низкий процент на сложном, плохо детерминируемом коде — нормально и осознанно (см. правила 7 и 19).

### 9. Изменение тестируемого кода

30. Менять тестируемый код можно **только** если в нём явно обнаружена проблема (баг, нарушенный контракт, опасное поведение). Сначала описываем проблему, потом правим код, и только потом обновляем/добавляем тест.
31. **Запрещено** менять рабочий код ради того, чтобы тест проходил. Если тест не сходится с кодом — проблема в тесте или в неверном понимании контракта: исправляем тест или его ожидания, а не подгоняем под него реализацию.
32. Если в процессе написания теста выявлена реальная проблема в коде — зафиксируй её отдельно (issue/PR) и не маскируй правкой «по-тихому» внутри тестового изменения.

## Примеры

### Pure-функция (без TestBed)

```ts
import {MathHelper} from './math.helper';

describe('MathHelper', () => {
  describe('round', () => {
    it('should round a number to the provided number of decimals', () => {
      expect(MathHelper.round(1.23456, 2)).toBe(1.23);
      expect(MathHelper.round(1.005, 2)).toBe(1.01);
    });
  });
});
```

### Сервис (TestBed + мок зависимости)

```ts
import {TestBed} from '@angular/core/testing';
import {LocalStorageService} from '@terminal-core-lib/features/local-storage/local-storage.service';
import {EnvironmentService} from './environment.service';
import {environment} from '../../environments/environment';

describe('EnvironmentService', () => {
  let service: EnvironmentService;
  let localStorageSpy: { getStringItem: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    localStorageSpy = {
      getStringItem: vi.fn().mockReturnValue(null)
    };

    TestBed.configureTestingModule({
      providers: [
        EnvironmentService,
        {provide: LocalStorageService, useValue: localStorageSpy}
      ]
    });

    service = TestBed.inject(EnvironmentService);
  });

  it('should prefer the debug override from local storage', () => {
    localStorageSpy.getStringItem.mockReturnValue('https://override.example');

    expect(service.apiUrl).toBe('https://override.example');
    expect(localStorageSpy.getStringItem).toHaveBeenCalledWith('debug.apiUrl');
  });
});
```

### Простой компонент (TestBed + ComponentFixture)

Тестируем только простой и детерминированный компонент (см. правило 7). Входы задаём через `componentRef.setInput()`, изменения применяем через `detectChanges()`, проверяем наблюдаемый результат — отрендеренный DOM или публичное состояние. Пример ниже иллюстративный (компонент объявлен в самом тесте), реальный компонент импортируется из его файла.

```ts
import {ChangeDetectionStrategy, Component, input} from '@angular/core';
import {TestBed} from '@angular/core/testing';

@Component({
  selector: 'ats-badge',
  template: `@if (color()) {<span class="badge" [class]="color()"></span>}`,
  changeDetection: ChangeDetectionStrategy.OnPush
})
class Badge {
  readonly color = input<string | null>(null);
}

describe('Badge', () => {
  function createComponent() {
    const fixture = TestBed.createComponent(Badge);
    const element = fixture.nativeElement as HTMLElement;

    return {fixture, element};
  }

  it('should render the badge with the provided color class', () => {
    const {fixture, element} = createComponent();
    fixture.componentRef.setInput('color', 'yellow');

    fixture.detectChanges();

    expect(element.querySelector('.badge')?.classList).toContain('yellow');
  });

  it('should not render a badge when no color is provided', () => {
    const {fixture, element} = createComponent();

    fixture.detectChanges();

    expect(element.querySelector('.badge')).toBeNull();
  });
});
```

Если компонент зависит от сервисов, Transloco или ng-zorro — подключай их через `TestBed` (`providers` с `useValue: { method: vi.fn() }`, `imports` с реальным модулем), а не через `ng-mocks`. Если для детерминированного запуска без зависаний требуется сложный сетап — тесты для компонента не пишем (правило 7).

## AI checklist перед коммитом тестов

- Тест написан на Vitest + `TestBed`, без Jasmine API и без `ng-mocks`.
- Файл `*.spec.ts` лежит рядом с тестируемым кодом; корневой `describe` назван по сущности.
- Покрыты happy-path, границы и некорректный вход; проверяется одно поведение на `it`.
- Каждый тест проверяет осознанный сценарий/контракт и ловит конкретную регрессию, а не написан ради процента coverage или тривиального кода.
- Тесты проверяют поведение, а не детали реализации (рефакторинг без смены поведения их не ломает).
- Тестируемый код не менялся ради прохождения теста; правки в нём есть только при явно обнаруженной проблеме.
- Внешние зависимости (HTTP, `localStorage`, время, случайность) замоканы; тест детерминирован.
- Асинхронные тесты дожидаются завершения; нет висящих подписок.
- Компонент тестируется только если он простой (без сложной RxJS-логики, сложной анимации и сложного сетапа `input()`) и тест отрабатывает одинаково без зависаний; иначе тесты для компонента не пишутся.
- Переиспользуемые фикстуры/моки/билдеры вынесены в `testing-lib` (через `@testing-lib/*`), а не продублированы.

## Связанные документы

- [`AGENTS.md`](../../AGENTS.md) — общие правила для AI агентов.
- [`projects/terminal-core-lib/CORE_SERVICES.md`](../terminal-core-lib/CORE_SERVICES.md) — общие сервисы (кандидаты на моки в тестах).
- [`API_DOCUMENTATION.md`](../../API_DOCUMENTATION.md) — API-контракты (для тестов сервисов).
