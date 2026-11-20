Online Booking — frontend

Содержимое:
- index.html
- styles.css
- app.js

Запуск:
1. Помести три файла в каталог, который Express раздаёт как static.
2. Убедись, что backend подключает этот каталог через express.static(...).
3. Запусти backend и открой его адрес в браузере.
4. Фронтенд использует относительные API URL, отдельный адрес API в app.js указывать не нужно.

Функции:
- пациенты, врачи, услуги;
- назначение услуг врачам;
- создание, изменение и деактивация расписания;
- создание записей на приём;
- перенос записи и смена услуги;
- изменение статуса и отмена записи;
- фильтр записей по пациенту и поиск;
- отображение дат и времени в Europe/Moscow.

Важно: в приложенных backend-файлах обнаружены несовпадения, которые нужно исправить перед проверкой создания/переноса записи:

1. В controllers/appointments.controller.js добавь импорт:
   const doctorSchedulesModel = require("../model/doctorSchedules.model");
   В createAppointment замени вызов doctorServicesModel.getDoctorSchedulesByDay(...) на doctorSchedulesModel.getDoctorSchedulesByDay(...).
   В updateAppointment уже используется doctorSchedulesModel, но без импорта это вызовет ReferenceError.

2. В controllers/doctors.controller.js функция listDoctorServices читает req.params.doctorId, а в routes/doctors.routes.js маршрут объявлен как /:id/services. Исправь одно из двух. Например, в контроллере:
   const doctorId = req.params.id;

Фронтенд не меняет API-контракты. Для создания записи отправляется patient_id, doctor_service_id и starts_at; ends_at рассчитывается сервером. Время starts_at отправляется с явным смещением +03:00.
