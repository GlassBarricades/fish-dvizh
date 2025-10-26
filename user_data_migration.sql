-- Миграция: Добавление полей имени, фамилии и даты рождения для существующих пользователей
-- Этот скрипт обновляет метаданные существующих пользователей в Supabase Auth

-- Поскольку поля хранятся в raw_user_meta_data JSONB колонке таблицы auth.users,
-- и эти данные управляются через Supabase Auth API, прямые SQL-операции не рекомендуется делать.
-- Однако, для будущих пользователей данные будут автоматически добавляться через форму регистрации.

-- Для существующих пользователей рекомендуется:
-- 1. Создать функцию для обновления метаданных пользователя
-- 2. Запустить миграцию через Supabase Dashboard -> SQL Editor

-- Функция для безопасного обновления метаданных пользователя
CREATE OR REPLACE FUNCTION update_user_metadata(
    p_user_id UUID,
    p_first_name TEXT DEFAULT NULL,
    p_last_name TEXT DEFAULT NULL,
    p_birth_date DATE DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_current_meta JSONB;
BEGIN
    -- Получаем текущие метаданные
    SELECT raw_user_meta_data INTO v_current_meta
    FROM auth.users
    WHERE id = p_user_id;
    
    -- Если метаданные пустые, инициализируем пустым объектом
    IF v_current_meta IS NULL THEN
        v_current_meta := '{}'::JSONB;
    END IF;
    
    -- Обновляем только переданные поля (не перезаписываем существующие данные)
    IF p_first_name IS NOT NULL THEN
        v_current_meta := jsonb_set(v_current_meta, '{first_name}', to_jsonb(p_first_name), true);
    END IF;
    
    IF p_last_name IS NOT NULL THEN
        v_current_meta := jsonb_set(v_current_meta, '{last_name}', to_jsonb(p_last_name), true);
    END IF;
    
    IF p_birth_date IS NOT NULL THEN
        v_current_meta := jsonb_set(v_current_meta, '{birth_date}', to_jsonb(p_birth_date::TEXT), true);
    END IF;
    
    -- Обновляем метаданные пользователя
    UPDATE auth.users
    SET raw_user_meta_data = v_current_meta,
        updated_at = NOW()
    WHERE id = p_user_id;
    
    RAISE NOTICE 'Метаданные пользователя % обновлены', p_user_id;
END;
$$;

-- Для массового обновления всех пользователей с пустыми полями
-- ВНИМАНИЕ: Выполняйте осторожно! Это обновит всех пользователей без данных.
-- Раскомментируйте только если вы уверены в результате:

-- UPDATE auth.users
-- SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::JSONB)
-- WHERE raw_user_meta_data IS NULL OR raw_user_meta_data = '{}'::JSONB;

-- Комментарий: 
-- Новые пользователи будут автоматически получать эти поля при регистрации через форму.
-- Для существующих пользователей эти поля можно заполнить через админ-панель или
-- вызвать функцию update_user_metadata() для каждого пользователя.

-- Пример использования функции:
-- SELECT update_user_metadata('user-id-here', 'Иван', 'Иванов', '1990-01-01');
