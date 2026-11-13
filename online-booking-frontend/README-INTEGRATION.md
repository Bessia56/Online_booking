# Online Booking — frontend

Фронтенд для существующего Node.js + Express API. Использует HTML, CSS и Vanilla JavaScript, без отдельного frontend-сервера и без дополнительных npm-зависимостей.

## 1. Размещение

Распакуй папку `public` в корень своего проекта:

```text
online_booking/
├── app.js
├── server.js
├── public/
│   ├── index.html
│   ├── styles.css
│   └── app.js
└── src/
    ├── controllers/
    ├── model/
    └── routes/
```

## 2. Подключение static в app.js

В начале `app.js` добавь:

```js
const path = require("path");
```

После `app.use(express.json())` и регистрации API-маршрутов, но до middleware 404, добавь:

```js
app.use(express.static(path.join(__dirname, "public")));
```

Порядок должен быть примерно таким:

```js
app.use(express.json());

app.use("/patients", patientsRoutes);
app.use("/doctors", doctorsRoutes);
app.use("/services", servicesRoutes);

app.use(express.static(path.join(__dirname, "public")));

app.use((req, res) => {
    res.status(404).json({ error: "Route not found" });
});
```

После запуска сервера открой `http://localhost:3000`.

## 3. Важные исправления backend перед запуском

### `src/routes/doctors.routes.js`

Сейчас в загруженном файле два обработчика `GET "/"`: `listDoctors` и `filterDoctors`. Оставь один:

```js
router.get("/", doctorsController.filterDoctors);
```

Иначе запрос с фильтрами может попадать в первый обработчик, который возвращает всех врачей.

Убедись, что маршрут `/doctors/:id/activate` остаётся:

```js
router.patch("/:id/activate", doctorsController.activateDoctor);
```

### `src/routes/doctorServices.routes.js`

Загруженный файл всё ещё импортирует `doctorServices.controller.js`, которого в выбранной архитектуре уже нет. Поскольку маршруты услуг врача находятся в `doctors.routes.js`, этот старый роутер не подключай и не используй.

### `server.js`

В загруженном файле дважды вызывается `app.listen()`. Оставь один запуск внутри `startServer()`:

```js
async function startServer() {
    try {
        await db.raw("SELECT 1");
        console.log("PostgreSQL connected!");

        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    } catch (error) {
        console.error("Database connection failed:", error.message);
        process.exit(1);
    }
}

startServer();
```

## 4. Поддерживаемые API-маршруты

Фронтенд использует следующие маршруты:

- `GET/POST /patients`
- `GET/PATCH/DELETE /patients/:id`
- `GET /doctors`
- `POST /doctors`
- `GET/PATCH/DELETE /doctors/:id`
- `PATCH /doctors/:id/activate`
- `GET /doctors?is_active=true|false`
- `GET /doctors/:doctorId/services`
- `POST /doctors/:doctorId/services`
- `PATCH/DELETE /doctors/:doctorId/services/:serviceId`
- `GET/POST /services`
- `GET/PATCH/DELETE /services/:id`

Для создания связи врач–услуга отправляется JSON:

```json
{
  "serviceId": 3,
  "durationMinutes": 40
}
```

Для изменения длительности:

```json
{
  "durationMinutes": 50
}
```

## 5. Запуск

1. Запусти PostgreSQL.
2. Убедись, что `.env` настроен.
3. Запусти Node.js API командой `npm start`.
4. Открой `http://localhost:3000`.

Фронтенд использует относительные API URL, поэтому отдельная настройка IP-адреса не нужна.

## Ограничения текущей версии

- Расписание и записи на приём пока не добавлены: соответствующие API-маршруты не были предоставлены.
- В загруженном backend у услуг есть деактивация, но нет маршрута повторной активации.
- Удаление пациента может быть запрещено внешним ключом, если у него есть записи на приём.
- В форме создания/редактирования используется фактический формат полей из предоставленных валидаторов и контроллеров.
