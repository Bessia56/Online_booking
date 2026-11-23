-- Инициализация базы данных медицинской системы
-- PostgreSQL
--
-- Скрипт создаёт таблицы, ограничения, индексы и триггеры.
-- Перед выполнением создайте пустую базу данных и подключитесь к ней.
-- Скрипт не удаляет существующие таблицы и данные.

-- Функция автоматического обновления updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

-- Врачи
CREATE TABLE public.doctors (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(255),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX doctors_active_idx
    ON public.doctors (id)
    WHERE is_active = TRUE;

CREATE INDEX doctors_last_first_name_idx
    ON public.doctors (last_name, first_name);

CREATE INDEX doctors_phone_idx
    ON public.doctors (phone);

-- Пациенты
CREATE TABLE public.patients (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(255),
    birth_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX patients_email_idx
    ON public.patients (email);

CREATE INDEX patients_last_first_name_idx
    ON public.patients (last_name, first_name);

CREATE INDEX patients_phone_idx
    ON public.patients (phone);

-- Услуги
CREATE TABLE public.services (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX services_price_idx
    ON public.services (price);

-- Расписание врачей
CREATE TABLE public.doctor_schedules (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    doctor_id BIGINT NOT NULL,
    day_of_week SMALLINT NOT NULL
        CHECK (day_of_week BETWEEN 1 AND 7),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL
        CHECK (end_time > start_time),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT doctor_schedules_unique
        UNIQUE (doctor_id, day_of_week, start_time),
    CONSTRAINT doctor_schedules_doctor_fk
        FOREIGN KEY (doctor_id) REFERENCES public.doctors (id)
);

-- Услуги, доступные у врачей
CREATE TABLE public.doctor_services (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    doctor_id BIGINT NOT NULL,
    service_id BIGINT NOT NULL,
    duration_minutes INTEGER NOT NULL
        CHECK (duration_minutes > 0),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT doctor_services_unique
        UNIQUE (doctor_id, service_id),
    CONSTRAINT doctor_services_doctors_fk
        FOREIGN KEY (doctor_id) REFERENCES public.doctors (id),
    CONSTRAINT doctor_services_services_fk
        FOREIGN KEY (service_id) REFERENCES public.services (id)
);

CREATE INDEX doctor_services_service_id_idx
    ON public.doctor_services (service_id);

-- Записи на приём
CREATE TABLE public.appointments (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    patient_id BIGINT NOT NULL,
    doctor_service_id BIGINT NOT NULL,
    starts_at TIMESTAMPTZ NOT NULL,
    ends_at TIMESTAMPTZ NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
    comment TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT appointments_check
        CHECK (ends_at > starts_at),
    CONSTRAINT appointments_doctor_service_fk
        FOREIGN KEY (doctor_service_id)
        REFERENCES public.doctor_services (id),
    CONSTRAINT appointments_patient_fk
        FOREIGN KEY (patient_id)
        REFERENCES public.patients (id)
);

CREATE INDEX appointments_doctor_service_start_idx
    ON public.appointments (doctor_service_id, starts_at);

CREATE INDEX appointments_patient_start_idx
    ON public.appointments (patient_id, starts_at DESC);

-- Триггеры автоматического обновления updated_at
CREATE TRIGGER doctors_updated_at
BEFORE UPDATE ON public.doctors
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER patients_updated_at
BEFORE UPDATE ON public.patients
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER services_updated_at
BEFORE UPDATE ON public.services
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER doctor_schedules_updated_at
BEFORE UPDATE ON public.doctor_schedules
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER doctor_services_updated_at
BEFORE UPDATE ON public.doctor_services
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER appointments_updated_at
BEFORE UPDATE ON public.appointments
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
