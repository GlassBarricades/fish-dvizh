-- Создание таблицы competition_roles для управления ролями в соревнованиях (без RLS)

-- Создаем таблицу
CREATE TABLE IF NOT EXISTS public.competition_roles (
    competition_id UUID NOT NULL REFERENCES competitions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('organizer', 'chief_judge', 'secretary', 'zone_judge')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (competition_id, user_id, role)
);

-- Создаем индексы для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_competition_roles_competition_id ON public.competition_roles(competition_id);
CREATE INDEX IF NOT EXISTS idx_competition_roles_user_id ON public.competition_roles(user_id);

-- Отключаем RLS полностью
ALTER TABLE public.competition_roles DISABLE ROW LEVEL SECURITY;

-- Предоставляем необходимые права для authenticated пользователей
GRANT SELECT, INSERT, UPDATE, DELETE ON public.competition_roles TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Если уже есть политики, удаляем их
DROP POLICY IF EXISTS "Users can view competition roles" ON public.competition_roles;
DROP POLICY IF EXISTS "Admins and competition creators can assign roles" ON public.competition_roles;
DROP POLICY IF EXISTS "Admins and competition creators can update roles" ON public.competition_roles;
DROP POLICY IF EXISTS "Admins and competition creators can delete roles" ON public.competition_roles;
