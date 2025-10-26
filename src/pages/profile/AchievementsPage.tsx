import { useState } from 'react'
import { Paper, Stack, Title, Text, Button, Group, Badge, Card, Modal } from '@mantine/core'
import { useAuth } from '@/features/auth/hooks'
import { useUserAchievements } from '@/features/achievements/hooks'
import { useUserRecentAchievements } from '@/features/achievements/hooks'
import { IconTrophy, IconCrown, IconStar, IconMedal } from '@tabler/icons-react'

export default function AchievementsPage() {
  const { user } = useAuth()
  const { data: achievements } = useUserAchievements(user?.id)
  const { recent } = useUserRecentAchievements(user?.id)

  const [achievementModalOpened, setAchievementModalOpened] = useState(false)
  const [selectedAchievement, setSelectedAchievement] = useState<any>(null)

  const openAchievementModal = (achievement: any) => {
    setSelectedAchievement(achievement)
    setAchievementModalOpened(true)
  }

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'gray'
      case 'rare': return 'blue'
      case 'epic': return 'purple'
      case 'legendary': return 'yellow'
      default: return 'gray'
    }
  }

  const getRarityLabel = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'Обычные'
      case 'rare': return 'Редкие'
      case 'epic': return 'Эпические'
      case 'legendary': return 'Легендарные'
      default: return 'Неизвестно'
    }
  }

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'competition': return 'Соревнования'
      case 'league': return 'Лига'
      case 'training': return 'Тренировки'
      case 'social': return 'Социальные'
      case 'special': return 'Особые'
      default: return 'Неизвестно'
    }
  }

  const getIconComponent = (iconName: string) => {
    switch (iconName) {
      case 'IconTrophy': return <IconTrophy size={20} />
      case 'IconMedal': return <IconMedal size={20} />
      case 'IconCrown': return <IconCrown size={20} />
      case 'IconStar': return <IconStar size={20} />
      default: return <IconTrophy size={20} />
    }
  }

  return (
    <>
      <Paper p="xl" withBorder>
        <Stack gap="md">
          <Title order={2}>Мои достижения</Title>
          
          {/* Последние достижения */}
          <Card withBorder p="md">
            <Title order={4} mb="xs">Последние достижения</Title>
            {recent.length > 0 ? (
              <Stack gap="xs">
                {recent.slice(0, 5).map((achievement: any) => (
                  <Group key={achievement.id} gap="sm" p="xs" style={{ borderRadius: 8, background: 'rgba(0,0,0,0.02)' }}>
                    <Badge 
                      variant="light" 
                      color={getRarityColor(achievement.achievements?.rarity)}
                      size="lg"
                    >
                      {getIconComponent(achievement.achievements?.icon)}
                    </Badge>
                    <Stack gap={2} style={{ flex: 1 }}>
                      <Text fw={500} size="sm">{achievement.achievements?.name}</Text>
                      <Text size="xs" c="dimmed">
                        {new Date(achievement.earned_at).toLocaleDateString()}
                      </Text>
                    </Stack>
                    <Button
                      size="xs"
                      variant="light"
                      onClick={() => openAchievementModal(achievement)}
                    >
                      Подробнее
                    </Button>
                  </Group>
                ))}
              </Stack>
            ) : (
              <Text c="dimmed">Пока нет достижений</Text>
            )}
          </Card>

          {/* Все достижения */}
          <Card withBorder p="md">
            <Title order={4} mb="xs">Все достижения</Title>
            {achievements && achievements.length > 0 ? (
              <Stack gap="sm">
                {achievements.map((achievement: any) => (
                  <Group key={achievement.id} gap="sm" p="sm" style={{ borderRadius: 8, background: 'rgba(0,0,0,0.02)' }}>
                    <Badge 
                      variant="light" 
                      color={getRarityColor(achievement.achievements?.rarity)}
                      size="lg"
                    >
                      {getIconComponent(achievement.achievements?.icon)}
                    </Badge>
                    <Stack gap={2} style={{ flex: 1 }}>
                      <Group gap="xs">
                        <Text fw={500}>{achievement.achievements?.name}</Text>
                        <Badge variant="light" color={getRarityColor(achievement.achievements?.rarity)} size="xs">
                          {getRarityLabel(achievement.achievements?.rarity)}
                        </Badge>
                        <Badge variant="light" color="blue" size="xs">
                          {getCategoryLabel(achievement.achievements?.category)}
                        </Badge>
                      </Group>
                      <Text size="sm" c="dimmed">
                        {achievement.achievements?.description}
                      </Text>
                      <Group gap="sm">
                        <Text size="sm" fw={500}>
                          {achievement.achievements?.points} очков
                        </Text>
                        <Text size="xs" c="dimmed">
                          {new Date(achievement.earned_at).toLocaleDateString()}
                        </Text>
                      </Group>
                    </Stack>
                  </Group>
                ))}
              </Stack>
            ) : (
              <Text c="dimmed">Пока нет достижений</Text>
            )}
          </Card>
        </Stack>
      </Paper>

      {/* Модальное окно с деталями достижения */}
      <Modal
        opened={achievementModalOpened}
        onClose={() => setAchievementModalOpened(false)}
        title={selectedAchievement?.achievements?.name}
        centered
      >
        {selectedAchievement && (
          <Stack gap="md">
            <Group justify="center">
              <Badge 
                size="xl" 
                variant="light" 
                color={getRarityColor(selectedAchievement.achievements?.rarity)}
              >
                {getIconComponent(selectedAchievement.achievements?.icon)}
              </Badge>
            </Group>
            
            <Stack align="center" gap="xs">
              <Badge variant="light" color={getRarityColor(selectedAchievement.achievements?.rarity)}>
                {getRarityLabel(selectedAchievement.achievements?.rarity)}
              </Badge>
              <Badge variant="light" color="blue">
                {getCategoryLabel(selectedAchievement.achievements?.category)}
              </Badge>
            </Stack>

            <Text ta="center" c="dimmed">
              {selectedAchievement.achievements?.description}
            </Text>

            <Group justify="space-between">
              <Text fw={500}>Очки: {selectedAchievement.achievements?.points}</Text>
              <Text size="sm" c="dimmed">
                Получено: {new Date(selectedAchievement.earned_at).toLocaleDateString()}
              </Text>
            </Group>
          </Stack>
        )}
      </Modal>
    </>
  )
}
