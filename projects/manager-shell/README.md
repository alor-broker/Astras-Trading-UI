# Astras Manager и Astras Encryptor: инструкция

Две переносимые программы для Windows x64:

| Программа | Назначение | Кто использует |
| --- | --- | --- |
| `AstrasEncryptor.exe` | Создаёт защищённый паролем файл со списком клиентов и refresh-токенами | Сотрудник, который подготавливает доступы |
| `AstrasManager.exe` | Открывает клиентский терминал Astras и позволяет переключаться между клиентами | Менеджер, работающий с клиентскими счетами |

Установка программ, Node.js и запуск локального сервера не нужны. Шифратор работает без интернета. Для работы менеджера нужен доступ к размещённому веб-терминалу и его API.

## 1. Что подготовить

Для создания конфигурации понадобятся:

- **Адрес веб-терминала** — HTTPS-адрес клиентского Astras. Адрес административного терминала не подходит.
- **Базовый адрес клиентского API** — HTTPS-адрес API того же окружения, без `/auth/actions/refresh`. Например, для рабочего клиентского API в текущем проекте используется `https://lk-api.alor.ru`. Не смешивайте адреса тестового и рабочего окружений.
- Для каждого клиента: **имя**, **идентификатор клиента** и **refresh-токен**, выданный для работы этого менеджера.
- Пароль для защиты файла, не короче **12 символов**.

Идентификатор клиента должен точно совпадать с `clientid`, возвращаемым в JWT при входе по его токену. Это не имя, не логин и не номер портфеля. Получите идентификатор вместе с токеном у сотрудника, выдающего доступы. Идентификаторы в одном файле должны быть уникальными.

Нужны refresh-токены клиентского endpoint, совместимые с текущим терминалом. Они должны оставаться действительными после обновления JWT: ротация refresh-токенов этой версией не поддерживается.

## 2. Создание файла в Astras Encryptor

1. Запустите `AstrasEncryptor.exe`.
2. При необходимости выберите **Русский** в поле **«Язык»**. Также доступны английский и армянский.
3. В разделе **«Адреса терминала»** заполните **«Адрес веб-терминала (HTTPS)»** и **«Базовый адрес клиентского API (HTTPS)»**.
4. В разделе **«Доступные клиенты»** заполните первую запись: **«Имя клиента»**, **«Идентификатор клиента»** и **«Refresh-токен»**. Имя будет отображаться в списке клиентов менеджера.
5. Нажмите **«Добавить клиента»** для каждой следующей записи. Лишнюю запись можно убрать кнопкой **«Удалить клиента»**. Должен остаться хотя бы один клиент.
6. В разделе **«Защита конфигурации»** введите пароль и повторите его. Пароли должны совпадать.
7. Нажмите **«Зашифровать и сохранить…»**.
8. Выберите папку и сохраните файл под именем **`clients.enc`**. Если файл уже существует, Windows запросит подтверждение замены.
9. Дождитесь сообщения **«Сохранено»** с путём к файлу.

Refresh-токены изначально скрыты. Флажок **«Показать refresh-токены»** позволяет проверить введённые значения. Кнопка **«Очистить клиентов и пароль»** очищает клиентские записи и пароли, оставляя адреса терминала и API.

После успешного сохранения клиентские записи и пароли автоматически очищаются. При отмене сохранения или ошибке они остаются в форме для повторной попытки. При закрытии программы введённые данные не сохраняются.

Шифратор не проверяет токены на сервере. Успешное создание файла подтверждает корректность формата и шифрования, но не наличие доступа к счёту. Проверка входа выполняется при выборе клиента в менеджере.

## 3. Что передать менеджеру

Положите в одну папку два файла:

```text
AstrasManager.exe
clients.enc
```

Пароль от `clients.enc` передайте отдельно. `AstrasEncryptor.exe` менеджеру для работы не нужен.

Имя **`clients.enc`** обязательно: менеджер ищет именно этот файл рядом с запускаемым `AstrasManager.exe`. Если файл сохранён под другим именем, переименуйте его. В Проводнике включите отображение расширений, чтобы случайно не получить `clients.enc.enc`.

Текущие сборки не подписаны сертификатом издателя, поэтому Windows может показать предупреждение SmartScreen. При корпоративной блокировке запуска обратитесь к ответственному за установку ПО.

## 4. Работа в Astras Manager

1. Убедитесь, что `clients.enc` находится рядом с `AstrasManager.exe`.
2. Запустите `AstrasManager.exe`.
3. Введите пароль, заданный при создании конфигурации, и нажмите **«Разблокировать»**. Это пароль файла, а не пароль клиентского аккаунта.
4. В списке **«Клиент»** над терминалом выберите нужную запись. До выбора клиента терминал не открывается.
5. Дождитесь загрузки. Над терминалом появится подпись **«Активный клиент»** с именем и идентификатором.
6. Проверьте активного клиента перед работой с портфелем или заявками. Далее используйте обычный интерфейс клиентского Astras.

Для перехода к другому клиенту выберите его в том же списке. Программа закроет предыдущий терминал, проверит токен нового клиента и откроет новый сеанс. Если вход не удался, терминал предыдущего клиента не останется открытым: появится сообщение об ошибке.

При переключении:

- несохранённые формы и настройки, хранящиеся только локально в этом сеансе, теряются;
- данные браузерного сеанса предыдущего клиента очищаются;
- **заявки, уже принятые сервером, не отменяются** и продолжают действовать.

## 5. Блокировка и завершение работы

Нажмите **«Заблокировать»** в панели над терминалом, чтобы закрыть клиентский сеанс и убрать расшифрованную конфигурацию из состояния программы. Для продолжения потребуется снова ввести пароль и выбрать клиента.

Программа также блокируется при блокировке Windows и переходе компьютера в спящий режим. После закрытия и повторного запуска пароль запрашивается заново.

Для переключения клиентов и завершения сеанса используйте список клиентов, кнопку **«Заблокировать»** или закрытие окна программы. Кнопка выхода внутри самого веб-терминала может запускать сценарий с отзывом refresh-токена. Переключение и блокировка в оболочке отзыв токенов не вызывают.

## 6. Изменение списка клиентов, токенов или пароля

1. В `AstrasEncryptor.exe` заново заполните адреса и **полный актуальный список клиентов**, включая тех, чей доступ должен сохраниться.
2. Укажите новый или прежний пароль и создайте новый `clients.enc`.
3. Заблокируйте или закройте `AstrasManager.exe`.
4. Замените `clients.enc` рядом с программой.
5. Запустите менеджер или разблокируйте его с паролем нового файла.

Импорт и редактирование существующего `.enc` в шифраторе пока не предусмотрены. Исходные сведения для повторного выпуска храните в принятом у вас защищённом месте. Забытый пароль восстановить через программы нельзя: потребуется создать конфигурацию заново.

Замена файла не меняет уже разблокированную конфигурацию до следующей разблокировки. Удаление клиента из нового файла не отзывает его токен на сервере и не делает старые копии файла недействительными. Для прекращения доступа требуется серверный отзыв соответствующего токена.

## 7. Частые ошибки

| Сообщение или ситуация | Что проверить |
| --- | --- |
| «Не удалось прочитать clients.enc» | Файл находится рядом с запускаемым `.exe`, называется точно `clients.enc` и доступен для чтения. |
| «Неверный пароль или повреждённая конфигурация» | Используется пароль именно от этой версии файла. Проверьте раскладку и Caps Lock. При повреждении замените файл исправной копией или создайте новый. |
| «Токен принадлежит другому клиенту» | `clientId` и refresh-токен относятся к одному клиенту. Исправьте запись в шифраторе и создайте файл заново. |
| «Не удалось войти» | Есть доступ к API, токен действителен, а адрес API соответствует окружению. При отзыве или истечении токена запросите новый. |
| «Не удалось загрузить терминал» | HTTPS-адрес веб-терминала указан верно, сервер доступен и соединение работает. После исправления выберите клиента повторно. |
| «Сеанс завершён или переход заблокирован» | Терминал мог перенаправить на страницу входа или за пределы разрешённого адреса. Повторите выбор клиента; если ошибка сохраняется, проверьте токен и конфигурацию. |
| «Пароли должны совпадать…» | Оба поля содержат одинаковый пароль длиной от 12 символов. |
| Шифратор просит проверить адреса и клиентов | Используются HTTPS-адреса без логина, пароля и параметров в URL; все поля клиентов заполнены; идентификаторы не повторяются. |
| «Не удалось сохранить конфигурацию» | Выбрана доступная для записи папка, имя заканчивается на `.enc`, на диске есть место и файл не заблокирован другой программой. |
| После замены файла показывается старый список | Заблокируйте менеджер и разблокируйте заново либо перезапустите программу. |

## Отладка входа: F12

Нажмите **F12** на экране входа или после щелчка по верхней панели менеджера, чтобы открыть DevTools оболочки. Во вкладке **Console** найдите сообщения `[Astras Manager auth]`, затем повторно выберите клиента. В них указаны адрес запроса, HTTP-статус, этап проверки и, при наличии, сетевой код `net::ERR_…`. Токены, пароль, заголовки и тела запросов/ответов в эти сообщения не записываются.

Первый запрос `/auth/actions/refresh` выполняется основным процессом Electron и **не отображается в Network страницы**. Для диагностики ошибки до открытия терминала используйте указанные сообщения Console.

Когда терминал открыт, щёлкните внутри него и нажмите **F12**: откроются DevTools самого терминала. Его HTTP-запросы доступны во вкладке **Network**. Включите запись запросов и **Preserve log**, затем воспроизведите проблему. Повторное F12 в исходном окне закрывает его DevTools. При переключении клиента старое окно терминала и его DevTools закрываются.

Данные Network могут содержать действующие токены: не передавайте HAR-файлы и снимки запросов без удаления секретов.

## 8. Ограничения текущей версии

- Оболочка работает с клиентским терминалом. Код Angular-приложения для переключения аккаунтов не изменяется.
- За один раз открыт один клиентский сеанс. Действия выполняются с правами выбранного клиента.
- Открытие отдельных браузерных окон, скачивание файлов, разрешения браузера и переходы за пределы адреса терминала заблокированы. Функции, которым это требуется, могут быть недоступны.
- Шифрование защищает файл на диске. Человек, имеющий файл и пароль, получает доступ к его содержимому; выдача, учёт действий и отзыв токенов остаются задачами backend.
- Перед рабочим использованием проверьте вход и переключение на тестовых клиентах в нужном окружении. Автоматические тесты проекта используют синтетические токены и не подтверждают доступность вашего сервера.

## Для разработчиков

Готовые `.exe` находятся в `release/`. Для сборки из исходников нужны Windows, Node.js 24+ и npm. Команды выполняются из `projects/manager-shell`:

```powershell
npm ci
npm run portable
npm run portable:encryptor
```

Для проверки типов, lint и модульных тестов выполните `npm run check`. Для проверок обеих программ в Electron с синтетическими данными — `npm run smoke`.

Ниже сохранена техническая документация: запуск из исходников, подготовка JSON через командную строку, контракт входа и устройство хранения.

<details>
<summary>Technical reference (English)</summary>

## Architecture

Separate Electron wrapper around the hosted **client** terminal. No Angular changes,
local HTTP server, or Node.js installation on the manager's computer are required.
This project uses native HTML controls, not Angular; its own strict TypeScript,
build and Vitest checks are independent of the Angular workspace.

## Configuration and distribution

### Desktop encryption tool (no JSON editing or Node.js required)

Run `AstrasEncryptor.exe` on the provisioning computer:

1. Enter the hosted terminal URL and its matching client API base URL (HTTPS).
2. Add each client's display name, client ID and manager-issued refresh token.
   Client IDs must be unique and match the `clientid` claim returned by authentication.
3. Enter and confirm a password of at least 12 characters.
4. Click **Encrypt and save…**, then save as `clients.enc` beside `AstrasManager.exe`.

The tool works offline and does not validate tokens against the backend. It writes
only an encrypted file, never a plaintext JSON file. Refresh tokens are masked by
default. Client entries and passwords are cleared after a successful save; cancelling
or a failed save preserves the form for retry. Closing the tool discards the form.
Existing files can be replaced after confirmation in the Windows Save dialog; the
new ciphertext is staged in the destination folder before replacing the old file.
Share the password separately. The encryption tool is only needed for provisioning;
managers still receive just `AstrasManager.exe` and `clients.enc`.

Both portable tools are built from this project, with separate entry points and
packages. To build the encryption executable:

```powershell
npm ci
npm run portable:encryptor
```

The result is `release/AstrasEncryptor.exe`. Its staging directory is
`release/encryptor/`, so packaging it does not overwrite the manager executable.
Use `npm run start:encryptor` to launch it from source.

### Command-line provisioning

Copy `clients.example.json` to `private/clients.json`, set the real terminal URL and
the matching client API base URL, and supply the manager-issued client refresh tokens.
`clientId` must exactly match the JWT `clientid` claim. Never commit actual tokens.

From this directory:

```powershell
npm ci
npm run build
npm run encrypt -- private/clients.json private/clients.enc
npm run portable
```

Building/provisioning requires Node.js 24+ and npm. The repository's root Angular
dependencies and pnpm lockfile are unchanged; this project has its own npm lockfile.

The encryption command asks for a password and confirmation without echoing them.
It refuses to overwrite an existing output file. Keep the plaintext source only in
your controlled provisioning environment. Distribute these two files together:

```text
AstrasManager.exe
clients.enc
```

The executable is in `release/`. Copy the encrypted file beside it. Never include
the plaintext JSON or password in the distribution. The password is requested on
every launch. The app selects no account automatically. Replacing `clients.enc`
takes effect after locking and unlocking. A portable build is unsigned unless your
release environment provides a signing certificate; Windows may show SmartScreen.

For development, put `clients.enc` in `private/` and run `npm start`.
Run `npm run check` for strict type checking, lint and unit tests.
Run `npm run smoke` on Windows for the real Electron session test. It creates only
synthetic credentials, serves mock HTTPS responses in memory, hides its window,
and checks A → B → A switching, early credential injection, account isolation,
identity mismatch, blocked redirects, and locking during authentication.
It also fills the encryption form, checks password/ID validation and cancellation,
saves and replaces a vault, checks write failures and field clearing, and decrypts
the generated file with the manager's existing vault reader.

## Session behavior

The local account bar displays the client name and ID. Switching first destroys the
old terminal view, closes its connections and clears its in-memory browser storage.
It then authenticates the selected token, checks the returned client identity and
expiry, and opens the hosted terminal with `localStorage.sso` populated before its
scripts run. Astras performs its normal startup refresh afterwards. A failed switch
leaves no account open. Lock and Windows screen lock discard the unlocked vault.
Orders already accepted by the backend are not cancelled by switching or locking.
Unsaved forms and local-only settings are discarded on each switch.

The wrapper never calls logout/revocation endpoints. The terminal's own logout may
still revoke a token: use the wrapper's Lock button or account selector instead.
Navigation to SSO closes the view and requires selecting an account again. Popups,
downloads, browser permissions and navigation outside the configured terminal
origin are blocked. Features requiring separate browser windows are unavailable.

## Authentication contract

Mirrors `ClientAuthService`: POST `{refreshToken}` to
`<clientDataUrl>/auth/actions/refresh`, response `{jwt}`. These are client-identity
tokens, not the public OpenAPI refresh tokens. The public API documentation linked
from `API_DOCUMENTATION.md` does not specify this private endpoint; compatibility
is based on the existing client service and the confirmed backend behavior.
Refresh tokens must be reusable/non-rotating, as required by the current terminal.
Rotating tokens require coordinated backend/frontend changes before use here.
The authenticated HTTPS response is trusted; decoding the JWT checks identity and
expiry, not its cryptographic signature. Backend authorization remains authoritative.

## Storage and security boundary

The vault uses scrypt (N=131072, r=8, p=1) and AES-256-GCM with a random salt and IV.
The encrypted format is versioned, authenticated and size-limited. Passwords, tokens
and response bodies are never logged. Only names and IDs reach the shell UI; only
the active account reaches the remote renderer. Browser sessions are nonpersistent,
with disk cache disabled. Electron may still write ordinary runtime metadata or OS
crash/swap data; this is not a guarantee against memory inspection or a compromised
Windows account. Encryption protects the file at rest, not against a manager who
has its password. Backend token issuance, attribution and revocation remain required.

The remote view has no Node.js access or shell-control bridge. Credentials are
seeded by a narrow preload, bound to that view and the configured origin. The
shell uses a separate session and validates every IPC sender. URLs must use HTTPS;
redirects on the credential exchange are rejected. Configure only trusted hosts.

Before rollout, validate real test accounts against the actual hosted build:
unlock, wrong password, A → B → A, expired/revoked token, identity mismatch,
network failure, lock/restart, and order entry under each selected client.
Do not test with live orders. Hosted changes to `sso` or authentication need a
wrapper compatibility check. No production tokens are included in this repository.

</details>
