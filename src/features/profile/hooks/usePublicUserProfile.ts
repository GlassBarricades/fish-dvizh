import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabaseClient'

interface PublicUserProfile {
  id: string
  email: string | null
  first_name: string | null
  last_name: string | null
  birth_date: string | null
  phone: string | null
  avatar: string | null
  role: string | null
  created_at: string
  total_achievements: number
  total_teams: number
  total_trainings: number
  total_points: number
  achievements?: any[]
  teams?: any[]
}

export function usePublicUserProfile(userId?: string) {
  return useQuery({
    queryKey: ['public-user-profile', userId],
    queryFn: async () => {
      if (!userId) return null

      // Получаем пользователя из profiles таблицы (если есть)
      // Иначе используем данные из auth через публичное API
      
      // Сначала пробуем получить из profiles
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      // Если профиля нет, пытаемся получить из user_metadata через RPC
      let userMetadata = profileData?.metadata || {}
      
      if (!profileData) {
        const { data: userMetadataData } = await supabase
          .rpc('get_user_public_metadata', { p_user_id: userId })
        userMetadata = userMetadataData || {}
      }

      // Получаем статистику достижений
      const { data: achievementsData } = await supabase
        .from('user_achievements')
        .select('*, achievements(*)')
        .eq('user_id', userId)
        .order('earned_at', { ascending: false })

      // Получаем статистику команд
      const { data: teamsData } = await supabase
        .from('team_members')
        .select(`
          team_id,
          role,
          teams (
            id,
            name,
            description,
            created_at,
            created_by
          )
        `)
        .eq('user_id', userId)

      // Получаем статистику тренировок
      const { data: trainingsData } = await supabase
        .from('trainings')
        .select('id')
        .eq('user_id', userId)
        .or('type.eq.solo,type.eq.team')

      const { data: achievementsByCategory } = await supabase
        .rpc('get_user_achievements_by_category', { p_user_id: userId })

      const totalPoints = achievementsByCategory?.[0]?.points || 0
      const totalAchievements = achievementsByCategory?.[0]?.total || 0

      const profile: PublicUserProfile = {
        id: userId,
        email: userMetadata.email || null,
        first_name: userMetadata.first_name,
        last_name: userMetadata.last_name,
        birth_date: userMetadata.birth_date,
        phone: userMetadata.phone,
        avatar: userMetadata.avatar,
        role: userMetadata.role,
        created_at: profileData?.created_at || new Date().toISOString(),
        total_achievements: totalAchievements,
        total_teams: teamsData?.length || 0,
        total_trainings: trainingsData?.length || 0,
        total_points: totalPoints,
        achievements: achievementsData?.map((a: any) => ({
          id: a.id,
          name: a.achievements?.name,
          description: a.achievements?.description,
          points: a.achievements?.points,
          earned_at: a.earned_at,
        })),
        teams: teamsData?.map((tm: any) => ({
          id: tm.teams?.id,
          name: tm.teams?.name,
          description: tm.teams?.description,
          created_at: tm.teams?.created_at,
          created_by: tm.teams?.created_by,
        })),
      }

      return profile
    },
    enabled: !!userId,
  })
}
