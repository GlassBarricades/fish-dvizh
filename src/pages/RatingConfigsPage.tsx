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
  NumberInput,
  Badge,
  Card,
  ThemeIcon,
  Grid
} from '@mantine/core'
import { IconPlus, IconEdit, IconTrash, IconSettings, IconTrophy } from '@tabler/icons-react'
import { useAuth } from '@/features/auth/hooks'
import { 
  useRatingConfigs, 
  useCreateRatingConfig, 
  useUpdateRatingConfig, 
  useDeleteRatingConfig 
} from '@/features/leagues/hooks'

export default function RatingConfigsPage() {
  const { role } = useAuth()
  const [createModalOpened, setCreateModalOpened] = useState(false)
  const [editModalOpened, setEditModalOpened] = useState(false)
  const [editingConfig, setEditingConfig] = useState<any>(null)
  const [newConfig, setNewConfig] = useState({
    name: '',
    description: '',
    points_per_place: [100, 80, 60, 50, 40, 30, 20, 10, 5, 1],
    competition_multipliers: { regular: 1.0, championship: 2.0 } as Record<string, number>,
    decay_period_months: 6,
    min_competitions: 3,
    bonus_rules: []
  })

  const { data: configs, isLoading } = useRatingConfigs()
  const createConfig = useCreateRatingConfig()
  const updateConfig = useUpdateRatingConfig()
  const deleteConfig = useDeleteRatingConfig()

  const handleCreateConfig = async () => {
    if (!newConfig.name) return

    await createConfig.mutateAsync(newConfig)
    setCreateModalOpened(false)
    setNewConfig({
      name: '',
      description: '',
      points_per_place: [100, 80, 60, 50, 40, 30, 20, 10, 5, 1],
      competition_multipliers: { regular: 1.0, championship: 2.0 } as Record<string, number>,
      decay_period_months: 6,
      min_competitions: 3,
      bonus_rules: []
    })
  }

  const handleEditConfig = async () => {
    if (!editingConfig || !editingConfig.name) return

    await updateConfig.mutateAsync({
      configId: editingConfig.id,
      input: editingConfig
    })
    setEditModalOpened(false)
    setEditingConfig(null)
  }

  const handleDeleteConfig = async (configId: string) => {
    await deleteConfig.mutateAsync(configId)
  }

  const openEditModal = (config: any) => {
    setEditingConfig({ ...config })
    setEditModalOpened(true)
  }

  const addPointsPlace = () => {
    const lastPoint = newConfig.points_per_place[newConfig.points_per_place.length - 1] || 1
    setNewConfig({
      ...newConfig,
      points_per_place: [...newConfig.points_per_place, Math.max(1, Math.floor(lastPoint * 0.8))]
    })
  }

  const removePointsPlace = (index: number) => {
    if (newConfig.points_per_place.length > 1) {
      const newPoints = [...newConfig.points_per_place]
      newPoints.splice(index, 1)
      setNewConfig({ ...newConfig, points_per_place: newPoints })
    }
  }

  const updatePointsPlace = (index: number, value: number) => {
    const newPoints = [...newConfig.points_per_place]
    newPoints[index] = value
    setNewConfig({ ...newConfig, points_per_place: newPoints })
  }

  const addMultiplier = () => {
    setNewConfig({
      ...newConfig,
      competition_multipliers: {
        ...newConfig.competition_multipliers,
        [`type_${Object.keys(newConfig.competition_multipliers).length + 1}`]: 1.0
      }
    })
  }

  const removeMultiplier = (key: string) => {
    const newMultipliers = { ...newConfig.competition_multipliers }
    delete newMultipliers[key]
    setNewConfig({ ...newConfig, competition_multipliers: newMultipliers })
  }

  const updateMultiplier = (key: string, value: number) => {
    setNewConfig({
      ...newConfig,
      competition_multipliers: {
        ...newConfig.competition_multipliers,
        [key]: value
      }
    })
  }

  if (role !== 'admin') {
    return (
      <Container size="lg" py="md">
        <Paper withBorder radius="md" p="lg">
          <Stack align="center" gap="md">
            <ThemeIcon size={64} radius="xl" variant="light" color="red">
              <IconSettings size={32} />
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
              <Title order={2}>Конфигурации рейтинга</Title>
              <Text c="dimmed">Настройте системы подсчета очков для лиг</Text>
            </Stack>
            <Button 
              leftSection={<IconPlus size={16} />}
              onClick={() => setCreateModalOpened(true)}
            >
              Создать конфигурацию
            </Button>
          </Group>
        </Paper>

        {/* Список конфигураций */}
        {isLoading ? (
          <Text>Загрузка конфигураций...</Text>
        ) : (
          <Grid>
            {(configs ?? []).map((config) => (
              <Grid.Col key={config.id} span={{ base: 12, md: 6 }}>
                <Card withBorder radius="md" p="md">
                  <Stack gap="sm">
                    <Group justify="space-between">
                      <Title order={4}>{config.name}</Title>
                      <Group gap="xs">
                        <ActionIcon 
                          variant="light" 
                          color="blue"
                          onClick={() => openEditModal(config)}
                        >
                          <IconEdit size={16} />
                        </ActionIcon>
                        <ActionIcon 
                          variant="light" 
                          color="red"
                          onClick={() => handleDeleteConfig(config.id)}
                        >
                          <IconTrash size={16} />
                        </ActionIcon>
                      </Group>
                    </Group>

                    {config.description && (
                      <Text size="sm" c="dimmed">
                        {config.description}
                      </Text>
                    )}

                    <Group gap="sm">
                      <Badge variant="light" color="blue">
                        {config.points_per_place?.length || 0} мест
                      </Badge>
                      <Badge variant="light" color="green">
                        {config.decay_period_months || 6} мес. затухание
                      </Badge>
                      <Badge variant="light" color="orange">
                        мин. {config.min_competitions || 3} соревнований
                      </Badge>
                    </Group>

                    <Stack gap="xs">
                      <Text size="sm" fw={500}>Очки за места:</Text>
                      <Text size="xs" c="dimmed">
                        {config.points_per_place?.slice(0, 10).join(', ') || 'Не настроено'}
                        {config.points_per_place && config.points_per_place.length > 10 && '...'}
                      </Text>
                    </Stack>

                    <Stack gap="xs">
                      <Text size="sm" fw={500}>Множители соревнований:</Text>
                      <Group gap="xs">
                        {Object.entries(config.competition_multipliers || {}).map(([key, value]) => (
                          <Badge key={key} variant="light" color="teal">
                            {key}: {value}x
                          </Badge>
                        ))}
                      </Group>
                    </Stack>
                  </Stack>
                </Card>
              </Grid.Col>
            ))}

            {configs && configs.length === 0 && (
              <Grid.Col span={12}>
                <Card withBorder radius="md" p="lg">
                  <Stack align="center" gap="md">
                    <ThemeIcon size={64} radius="xl" variant="light" color="gray">
                      <IconTrophy size={32} />
                    </ThemeIcon>
                    <Stack align="center" gap="xs">
                      <Title order={4}>Нет конфигураций рейтинга</Title>
                      <Text c="dimmed" ta="center">
                        Создайте первую конфигурацию для настройки системы подсчета очков
                      </Text>
                    </Stack>
                    <Button 
                      leftSection={<IconPlus size={16} />}
                      onClick={() => setCreateModalOpened(true)}
                    >
                      Создать конфигурацию
                    </Button>
                  </Stack>
                </Card>
              </Grid.Col>
            )}
          </Grid>
        )}
      </Stack>

      {/* Модальное окно создания конфигурации */}
      <Modal
        opened={createModalOpened}
        onClose={() => setCreateModalOpened(false)}
        title="Создать конфигурацию рейтинга"
        size="lg"
        centered
      >
        <Stack gap="md">
          <TextInput
            label="Название конфигурации"
            placeholder="Стандартная система очков"
            value={newConfig.name}
            onChange={(e) => setNewConfig({ ...newConfig, name: e.target.value })}
            required
          />

          <Textarea
            label="Описание"
            placeholder="Описание системы подсчета очков"
            value={newConfig.description}
            onChange={(e) => setNewConfig({ ...newConfig, description: e.target.value })}
            minRows={2}
          />

          <Stack gap="sm">
            <Group justify="space-between" align="center">
              <Text fw={500}>Очки за места</Text>
              <Button size="xs" variant="light" onClick={addPointsPlace}>
                Добавить место
              </Button>
            </Group>
            <Group gap="xs" wrap="wrap">
              {newConfig.points_per_place.map((points, index) => (
                <Group key={index} gap="xs">
                  <Text size="sm">#{index + 1}:</Text>
                  <NumberInput
                    size="xs"
                    w={80}
                    value={points}
                    onChange={(value) => updatePointsPlace(index, Number(value) || 0)}
                    min={0}
                  />
                  {newConfig.points_per_place.length > 1 && (
                    <ActionIcon 
                      size="xs" 
                      color="red" 
                      variant="light"
                      onClick={() => removePointsPlace(index)}
                    >
                      <IconTrash size={12} />
                    </ActionIcon>
                  )}
                </Group>
              ))}
            </Group>
          </Stack>

          <Stack gap="sm">
            <Group justify="space-between" align="center">
              <Text fw={500}>Множители соревнований</Text>
              <Button size="xs" variant="light" onClick={addMultiplier}>
                Добавить тип
              </Button>
            </Group>
            <Stack gap="xs">
              {Object.entries(newConfig.competition_multipliers).map(([key, value]) => (
                <Group key={key} gap="sm">
                  <TextInput
                    size="sm"
                    placeholder="Тип соревнования"
                    value={key}
                    onChange={(e) => {
                      const newMultipliers = { ...newConfig.competition_multipliers }
                      delete newMultipliers[key]
                      newMultipliers[e.target.value] = value
                      setNewConfig({ ...newConfig, competition_multipliers: newMultipliers })
                    }}
                  />
                  <NumberInput
                    size="sm"
                    w={100}
                    value={value}
                    onChange={(val) => updateMultiplier(key, Number(val) || 1)}
                    min={0.1}
                    step={0.1}
                    decimalScale={1}
                  />
                  <ActionIcon 
                    color="red" 
                    variant="light"
                    onClick={() => removeMultiplier(key)}
                  >
                    <IconTrash size={16} />
                  </ActionIcon>
                </Group>
              ))}
            </Stack>
          </Stack>

          <Group grow>
            <NumberInput
              label="Период затухания (месяцы)"
              value={newConfig.decay_period_months}
              onChange={(value) => setNewConfig({ ...newConfig, decay_period_months: Number(value) || 6 })}
              min={1}
              max={24}
            />
            <NumberInput
              label="Минимум соревнований"
              value={newConfig.min_competitions}
              onChange={(value) => setNewConfig({ ...newConfig, min_competitions: Number(value) || 1 })}
              min={1}
            />
          </Group>

          <Group justify="flex-end" gap="sm">
            <Button variant="light" onClick={() => setCreateModalOpened(false)}>
              Отмена
            </Button>
            <Button 
              onClick={handleCreateConfig}
              loading={createConfig.isPending}
              disabled={!newConfig.name}
            >
              Создать
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Модальное окно редактирования конфигурации */}
      <Modal
        opened={editModalOpened}
        onClose={() => setEditModalOpened(false)}
        title="Редактировать конфигурацию рейтинга"
        size="lg"
        centered
      >
        {editingConfig && (
          <Stack gap="md">
            <TextInput
              label="Название конфигурации"
              value={editingConfig.name}
              onChange={(e) => setEditingConfig({ ...editingConfig, name: e.target.value })}
              required
            />

            <Textarea
              label="Описание"
              value={editingConfig.description || ''}
              onChange={(e) => setEditingConfig({ ...editingConfig, description: e.target.value })}
              minRows={2}
            />

            <Group grow>
              <NumberInput
                label="Период затухания (месяцы)"
                value={editingConfig.decay_period_months}
                onChange={(value) => setEditingConfig({ ...editingConfig, decay_period_months: Number(value) || 6 })}
                min={1}
                max={24}
              />
              <NumberInput
                label="Минимум соревнований"
                value={editingConfig.min_competitions}
                onChange={(value) => setEditingConfig({ ...editingConfig, min_competitions: Number(value) || 1 })}
                min={1}
              />
            </Group>

            <Group justify="flex-end" gap="sm">
              <Button variant="light" onClick={() => setEditModalOpened(false)}>
                Отмена
              </Button>
              <Button 
                onClick={handleEditConfig}
                loading={updateConfig.isPending}
                disabled={!editingConfig.name}
              >
                Сохранить
              </Button>
            </Group>
          </Stack>
        )}
      </Modal>
    </Container>
  )
}
