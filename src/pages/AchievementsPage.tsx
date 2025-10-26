import { useState } from 'react'
import {
  Container,
  Stack,
  Title,
  Text,
  Paper,
  Group,
  Button,
  ActionIcon,
  Modal,
  TextInput,
  Textarea,
  Select,
  NumberInput,
  Badge,
  Card,
  ThemeIcon,
  Grid,
  Tabs
} from '@mantine/core'
import { IconPlus, IconEdit, IconTrash, IconTrophy, IconMedal, IconCrown, IconStar } from '@tabler/icons-react'
import { useAuth } from '@/features/auth/hooks'
import { 
  useAchievements, 
  useCreateAchievement, 
  useDeleteAchievement,
  useRewards,
  useCreateReward,
  useDeleteReward
} from '@/features/achievements/hooks'

export default function AchievementsPage() {
  const { role } = useAuth()
  const [activeTab, setActiveTab] = useState<string>('achievements')
  const [createAchievementModalOpened, setCreateAchievementModalOpened] = useState(false)
  const [createRewardModalOpened, setCreateRewardModalOpened] = useState(false)

  // Состояние для создания достижения
  const [newAchievement, setNewAchievement] = useState({
    name: '',
    description: '',
    icon: 'IconTrophy',
    category: 'competition' as const,
    rarity: 'common' as const,
    points: 10,
    conditions: []
  })

  // Состояние для создания награды
  const [newReward, setNewReward] = useState({
    name: '',
    description: '',
    type: 'badge' as const,
    icon: 'IconMedal',
    rarity: 'common' as const,
    conditions: []
  })

  const { data: achievements, isLoading: achievementsLoading } = useAchievements()
  const { data: rewards, isLoading: rewardsLoading } = useRewards()
  const createAchievement = useCreateAchievement()
  const deleteAchievement = useDeleteAchievement()
  const createReward = useCreateReward()
  const deleteReward = useDeleteReward()

  const handleCreateAchievement = async () => {
    if (!newAchievement.name) return

    await createAchievement.mutateAsync(newAchievement)
    setCreateAchievementModalOpened(false)
    setNewAchievement({
      name: '',
      description: '',
      icon: 'IconTrophy',
      category: 'competition',
      rarity: 'common',
      points: 10,
      conditions: []
    })
  }

  const handleCreateReward = async () => {
    if (!newReward.name) return

    await createReward.mutateAsync(newReward)
    setCreateRewardModalOpened(false)
    setNewReward({
      name: '',
      description: '',
      type: 'badge',
      icon: 'IconMedal',
      rarity: 'common',
      conditions: []
    })
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
      case 'common': return 'Обычное'
      case 'rare': return 'Редкое'
      case 'epic': return 'Эпическое'
      case 'legendary': return 'Легендарное'
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

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'badge': return 'Значок'
      case 'title': return 'Титул'
      case 'privilege': return 'Привилегия'
      case 'item': return 'Предмет'
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

  if (role !== 'admin') {
    return (
      <Container size="lg" py="md">
        <Paper withBorder radius="md" p="lg">
          <Stack align="center" gap="md">
            <ThemeIcon size={64} radius="xl" variant="light" color="red">
              <IconTrophy size={32} />
            </ThemeIcon>
            <Title order={3}>Доступ запрещен</Title>
            <Text c="dimmed" ta="center">
              Эта страница доступна только администраторам
            </Text>
          </Stack>
        </Paper>
      </Container>
    )
  }

  return (
    <Container size="lg" py="md">
      <Stack gap="lg">
        {/* Заголовок */}
        <Paper withBorder radius="md" p="lg">
          <Group justify="space-between" align="center">
            <Stack gap="xs">
              <Title order={2}>Достижения и награды</Title>
              <Text c="dimmed">Управление системой достижений и наград</Text>
            </Stack>
            <Group>
              <Button 
                leftSection={<IconPlus size={16} />}
                onClick={() => setCreateAchievementModalOpened(true)}
              >
                Создать достижение
              </Button>
              <Button 
                leftSection={<IconPlus size={16} />}
                variant="light"
                onClick={() => setCreateRewardModalOpened(true)}
              >
                Создать награду
              </Button>
            </Group>
          </Group>
        </Paper>

        {/* Табы */}
        <Tabs value={activeTab} onChange={(v) => setActiveTab(v ?? 'achievements')}>
          <Tabs.List>
            <Tabs.Tab value="achievements">Достижения</Tabs.Tab>
            <Tabs.Tab value="rewards">Награды</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="achievements" pt="md">
            {achievementsLoading ? (
              <Text>Загрузка достижений...</Text>
            ) : (
              <Grid>
                {(achievements ?? []).map((achievement) => (
                  <Grid.Col key={achievement.id} span={{ base: 12, md: 6 }}>
                    <Card withBorder radius="md" p="md">
                      <Stack gap="sm">
                        <Group justify="space-between">
                          <Group gap="sm">
                            <ThemeIcon 
                              radius="xl" 
                              color={getRarityColor(achievement.rarity)}
                              variant="light"
                            >
                              {getIconComponent(achievement.icon)}
                            </ThemeIcon>
                            <Stack gap={2}>
                              <Text fw={600}>{achievement.name}</Text>
                              <Group gap="xs">
                                <Badge variant="light" color={getRarityColor(achievement.rarity)} size="sm">
                                  {getRarityLabel(achievement.rarity)}
                                </Badge>
                                <Badge variant="light" color="blue" size="sm">
                                  {getCategoryLabel(achievement.category)}
                                </Badge>
                              </Group>
                            </Stack>
                          </Group>
                          <Group gap="xs">
                            <ActionIcon 
                              variant="light" 
                              color="blue"
                              onClick={() => {
                                // TODO: Implement edit functionality
                              }}
                            >
                              <IconEdit size={16} />
                            </ActionIcon>
                            <ActionIcon 
                              variant="light" 
                              color="red"
                              onClick={() => deleteAchievement.mutateAsync(achievement.id)}
                            >
                              <IconTrash size={16} />
                            </ActionIcon>
                          </Group>
                        </Group>

                        <Text size="sm" c="dimmed">
                          {achievement.description}
                        </Text>

                        <Group justify="space-between">
                          <Text size="sm" fw={500}>
                            Очки: {achievement.points}
                          </Text>
                          <Text size="sm" c="dimmed">
                            Условий: {achievement.conditions.length}
                          </Text>
                        </Group>
                      </Stack>
                    </Card>
                  </Grid.Col>
                ))}

                {achievements && achievements.length === 0 && (
                  <Grid.Col span={12}>
                    <Card withBorder radius="md" p="lg">
                      <Stack align="center" gap="md">
                        <ThemeIcon size={64} radius="xl" variant="light" color="gray">
                          <IconTrophy size={32} />
                        </ThemeIcon>
                        <Stack align="center" gap="xs">
                          <Title order={4}>Нет достижений</Title>
                          <Text c="dimmed" ta="center">
                            Создайте первое достижение для мотивации участников
                          </Text>
                        </Stack>
                        <Button 
                          leftSection={<IconPlus size={16} />}
                          onClick={() => setCreateAchievementModalOpened(true)}
                        >
                          Создать достижение
                        </Button>
                      </Stack>
                    </Card>
                  </Grid.Col>
                )}
              </Grid>
            )}
          </Tabs.Panel>

          <Tabs.Panel value="rewards" pt="md">
            {rewardsLoading ? (
              <Text>Загрузка наград...</Text>
            ) : (
              <Grid>
                {(rewards ?? []).map((reward) => (
                  <Grid.Col key={reward.id} span={{ base: 12, md: 6 }}>
                    <Card withBorder radius="md" p="md">
                      <Stack gap="sm">
                        <Group justify="space-between">
                          <Group gap="sm">
                            <ThemeIcon 
                              radius="xl" 
                              color={getRarityColor(reward.rarity)}
                              variant="light"
                            >
                              {getIconComponent(reward.icon)}
                            </ThemeIcon>
                            <Stack gap={2}>
                              <Text fw={600}>{reward.name}</Text>
                              <Group gap="xs">
                                <Badge variant="light" color={getRarityColor(reward.rarity)} size="sm">
                                  {getRarityLabel(reward.rarity)}
                                </Badge>
                                <Badge variant="light" color="green" size="sm">
                                  {getTypeLabel(reward.type)}
                                </Badge>
                              </Group>
                            </Stack>
                          </Group>
                          <Group gap="xs">
                            <ActionIcon 
                              variant="light" 
                              color="blue"
                              onClick={() => {
                                // TODO: Implement edit functionality
                              }}
                            >
                              <IconEdit size={16} />
                            </ActionIcon>
                            <ActionIcon 
                              variant="light" 
                              color="red"
                              onClick={() => deleteReward.mutateAsync(reward.id)}
                            >
                              <IconTrash size={16} />
                            </ActionIcon>
                          </Group>
                        </Group>

                        <Text size="sm" c="dimmed">
                          {reward.description}
                        </Text>

                        <Group justify="space-between">
                          <Text size="sm" fw={500}>
                            Тип: {getTypeLabel(reward.type)}
                          </Text>
                          <Text size="sm" c="dimmed">
                            Условий: {reward.conditions.length}
                          </Text>
                        </Group>
                      </Stack>
                    </Card>
                  </Grid.Col>
                ))}

                {rewards && rewards.length === 0 && (
                  <Grid.Col span={12}>
                    <Card withBorder radius="md" p="lg">
                      <Stack align="center" gap="md">
                        <ThemeIcon size={64} radius="xl" variant="light" color="gray">
                          <IconMedal size={32} />
                        </ThemeIcon>
                        <Stack align="center" gap="xs">
                          <Title order={4}>Нет наград</Title>
                          <Text c="dimmed" ta="center">
                            Создайте первую награду для поощрения лучших участников
                          </Text>
                        </Stack>
                        <Button 
                          leftSection={<IconPlus size={16} />}
                          onClick={() => setCreateRewardModalOpened(true)}
                        >
                          Создать награду
                        </Button>
                      </Stack>
                    </Card>
                  </Grid.Col>
                )}
              </Grid>
            )}
          </Tabs.Panel>
        </Tabs>
      </Stack>

      {/* Модальное окно создания достижения */}
      <Modal
        opened={createAchievementModalOpened}
        onClose={() => setCreateAchievementModalOpened(false)}
        title="Создать достижение"
        size="md"
        centered
      >
        <Stack gap="md">
          <TextInput
            label="Название достижения"
            placeholder="Первая победа"
            value={newAchievement.name}
            onChange={(e) => setNewAchievement({ ...newAchievement, name: e.target.value })}
            required
          />

          <Textarea
            label="Описание"
            placeholder="Описание достижения"
            value={newAchievement.description}
            onChange={(e) => setNewAchievement({ ...newAchievement, description: e.target.value })}
            minRows={2}
          />

          <Group grow>
            <Select
              label="Категория"
              data={[
                { value: 'competition', label: 'Соревнования' },
                { value: 'league', label: 'Лига' },
                { value: 'training', label: 'Тренировки' },
                { value: 'social', label: 'Социальные' },
                { value: 'special', label: 'Особые' }
              ]}
              value={newAchievement.category}
              onChange={(value) => setNewAchievement({ ...newAchievement, category: value as any })}
            />
            <Select
              label="Редкость"
              data={[
                { value: 'common', label: 'Обычное' },
                { value: 'rare', label: 'Редкое' },
                { value: 'epic', label: 'Эпическое' },
                { value: 'legendary', label: 'Легендарное' }
              ]}
              value={newAchievement.rarity}
              onChange={(value) => setNewAchievement({ ...newAchievement, rarity: value as any })}
            />
          </Group>

          <Group grow>
            <Select
              label="Иконка"
              data={[
                { value: 'IconTrophy', label: 'Кубок' },
                { value: 'IconMedal', label: 'Медаль' },
                { value: 'IconCrown', label: 'Корона' },
                { value: 'IconStar', label: 'Звезда' }
              ]}
              value={newAchievement.icon}
              onChange={(value) => setNewAchievement({ ...newAchievement, icon: value || 'IconTrophy' })}
            />
            <NumberInput
              label="Очки"
              value={newAchievement.points}
              onChange={(value) => setNewAchievement({ ...newAchievement, points: Number(value) || 10 })}
              min={1}
            />
          </Group>

          <Group justify="flex-end" gap="sm">
            <Button variant="light" onClick={() => setCreateAchievementModalOpened(false)}>
              Отмена
            </Button>
            <Button 
              onClick={handleCreateAchievement}
              loading={createAchievement.isPending}
              disabled={!newAchievement.name}
            >
              Создать
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Модальное окно создания награды */}
      <Modal
        opened={createRewardModalOpened}
        onClose={() => setCreateRewardModalOpened(false)}
        title="Создать награду"
        size="md"
        centered
      >
        <Stack gap="md">
          <TextInput
            label="Название награды"
            placeholder="Чемпион сезона"
            value={newReward.name}
            onChange={(e) => setNewReward({ ...newReward, name: e.target.value })}
            required
          />

          <Textarea
            label="Описание"
            placeholder="Описание награды"
            value={newReward.description}
            onChange={(e) => setNewReward({ ...newReward, description: e.target.value })}
            minRows={2}
          />

          <Group grow>
            <Select
              label="Тип награды"
              data={[
                { value: 'badge', label: 'Значок' },
                { value: 'title', label: 'Титул' },
                { value: 'privilege', label: 'Привилегия' },
                { value: 'item', label: 'Предмет' }
              ]}
              value={newReward.type}
              onChange={(value) => setNewReward({ ...newReward, type: value as any })}
            />
            <Select
              label="Редкость"
              data={[
                { value: 'common', label: 'Обычное' },
                { value: 'rare', label: 'Редкое' },
                { value: 'epic', label: 'Эпическое' },
                { value: 'legendary', label: 'Легендарное' }
              ]}
              value={newReward.rarity}
              onChange={(value) => setNewReward({ ...newReward, rarity: value as any })}
            />
          </Group>

          <Select
            label="Иконка"
            data={[
              { value: 'IconTrophy', label: 'Кубок' },
              { value: 'IconMedal', label: 'Медаль' },
              { value: 'IconCrown', label: 'Корона' },
              { value: 'IconStar', label: 'Звезда' }
            ]}
            value={newReward.icon}
            onChange={(value) => setNewReward({ ...newReward, icon: value || 'IconMedal' })}
          />

          <Group justify="flex-end" gap="sm">
            <Button variant="light" onClick={() => setCreateRewardModalOpened(false)}>
              Отмена
            </Button>
            <Button 
              onClick={handleCreateReward}
              loading={createReward.isPending}
              disabled={!newReward.name}
            >
              Создать
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Container>
  )
}
