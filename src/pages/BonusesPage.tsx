import { useState } from 'react'
import {
  Box,
  Button,
  Card,
  Container,
  Group,
  Modal,
  NumberInput,
  Select,
  Stack,
  Table,
  Text,
  TextInput,
  Textarea,
  Title,
  Grid,
  Badge,
  ActionIcon,
  Tooltip,
  Tabs,
  Alert
} from '@mantine/core'
import { DatePickerInput } from '@mantine/dates'
import { IconPlus, IconEdit, IconTrash, IconInfoCircle, IconGift, IconSettings } from '@tabler/icons-react'
import { useForm } from '@mantine/form'
import { useBonuses, useCreateBonus, useUpdateBonus, useDeleteBonus } from '@/features/bonuses/hooks'
import { useSpecialRules, useCreateSpecialRule, useUpdateSpecialRule, useDeleteSpecialRule } from '@/features/bonuses/hooks'
import { useBonusStats } from '@/features/bonuses/hooks'
import { useActiveLeagues } from '@/features/leagues/hooks'
import type { CreateBonusInput, CreateSpecialRuleInput, BonusType } from '@/features/bonuses/types'

export default function BonusesPage() {
  const [activeTab, setActiveTab] = useState<string>('bonuses')
  const [bonusModalOpened, setBonusModalOpened] = useState(false)
  const [ruleModalOpened, setRuleModalOpened] = useState(false)
  const [editingBonus, setEditingBonus] = useState<any>(null)
  const [editingRule, setEditingRule] = useState<any>(null)

  const { data: bonuses } = useBonuses()
  const { data: specialRules } = useSpecialRules()
  const { data: bonusStats } = useBonusStats()
  const { data: activeLeagues } = useActiveLeagues()

  const createBonus = useCreateBonus()
  const updateBonus = useUpdateBonus()
  const deleteBonus = useDeleteBonus()
  const createSpecialRule = useCreateSpecialRule()
  const updateSpecialRule = useUpdateSpecialRule()
  const deleteSpecialRule = useDeleteSpecialRule()

  // Форма для создания/редактирования бонуса
  const bonusForm = useForm<CreateBonusInput>({
    initialValues: {
      name: '',
      description: '',
      type: 'points_multiplier' as BonusType,
      value: 1.5,
      conditions: [],
      expires_at: undefined,
      max_uses: undefined,
      league_id: undefined
    }
  })

  // Форма для создания/редактирования специального правила
  const ruleForm = useForm<CreateSpecialRuleInput>({
    initialValues: {
      name: '',
      description: '',
      type: 'scoring_modifier',
      conditions: [],
      effects: [],
      league_id: undefined,
      competition_id: undefined,
      priority: 1
    }
  })

  const handleCreateBonus = async (values: CreateBonusInput) => {
    await createBonus.mutateAsync(values)
    setBonusModalOpened(false)
    bonusForm.reset()
  }

  const handleUpdateBonus = async (values: CreateBonusInput) => {
    if (editingBonus) {
      await updateBonus.mutateAsync({ id: editingBonus.id, input: values })
      setEditingBonus(null)
      setBonusModalOpened(false)
      bonusForm.reset()
    }
  }

  const handleDeleteBonus = async (id: string) => {
    await deleteBonus.mutateAsync(id)
  }

  const handleCreateSpecialRule = async (values: CreateSpecialRuleInput) => {
    await createSpecialRule.mutateAsync(values)
    setRuleModalOpened(false)
    ruleForm.reset()
  }

  const handleUpdateSpecialRule = async (values: CreateSpecialRuleInput) => {
    if (editingRule) {
      await updateSpecialRule.mutateAsync({ id: editingRule.id, input: values })
      setEditingRule(null)
      setRuleModalOpened(false)
      ruleForm.reset()
    }
  }

  const handleDeleteSpecialRule = async (id: string) => {
    await deleteSpecialRule.mutateAsync(id)
  }

  const openBonusEdit = (bonus: any) => {
    setEditingBonus(bonus)
    bonusForm.setValues({
      name: bonus.name,
      description: bonus.description,
      type: bonus.type,
      value: bonus.value,
      conditions: bonus.conditions,
      expires_at: bonus.expires_at,
      max_uses: bonus.max_uses,
      league_id: bonus.league_id
    })
    setBonusModalOpened(true)
  }

  const openRuleEdit = (rule: any) => {
    setEditingRule(rule)
    ruleForm.setValues({
      name: rule.name,
      description: rule.description,
      type: rule.type,
      conditions: rule.conditions,
      effects: rule.effects,
      league_id: rule.league_id,
      competition_id: rule.competition_id,
      priority: rule.priority
    })
    setRuleModalOpened(true)
  }

  const getBonusTypeLabel = (type: BonusType) => {
    switch (type) {
      case 'points_multiplier': return 'Множитель очков'
      case 'rating_boost': return 'Увеличение рейтинга'
      case 'achievement_unlock': return 'Разблокировка достижения'
      case 'special_title': return 'Специальный титул'
      case 'exclusive_access': return 'Эксклюзивный доступ'
      case 'custom_reward': return 'Пользовательская награда'
      default: return 'Неизвестно'
    }
  }

  const getBonusTypeColor = (type: BonusType) => {
    switch (type) {
      case 'points_multiplier': return 'blue'
      case 'rating_boost': return 'green'
      case 'achievement_unlock': return 'purple'
      case 'special_title': return 'yellow'
      case 'exclusive_access': return 'red'
      case 'custom_reward': return 'orange'
      default: return 'gray'
    }
  }

  return (
    <Container size="lg" py="md">
      <Stack gap="lg">
        <Box>
          <Title order={2} mb="sm">Система бонусов и специальных правил</Title>
          <Text c="dimmed" size="sm">
            Управляйте бонусами, специальными правилами и наградами для участников
          </Text>
        </Box>

        {/* Статистика */}
        {bonusStats && (
          <Card withBorder>
            <Card.Section p="md">
              <Title order={4}>Статистика системы бонусов</Title>
            </Card.Section>
            <Card.Section p="md" pt={0}>
              <Grid>
                <Grid.Col span={3}>
                  <Stack align="center" gap="xs">
                    <Text fw={600} size="xl">{bonusStats.total_bonuses}</Text>
                    <Text size="sm" c="dimmed">Всего бонусов</Text>
                  </Stack>
                </Grid.Col>
                <Grid.Col span={3}>
                  <Stack align="center" gap="xs">
                    <Text fw={600} size="xl">{bonusStats.active_bonuses}</Text>
                    <Text size="sm" c="dimmed">Активных</Text>
                  </Stack>
                </Grid.Col>
                <Grid.Col span={3}>
                  <Stack align="center" gap="xs">
                    <Text fw={600} size="xl">{bonusStats.total_uses}</Text>
                    <Text size="sm" c="dimmed">Использований</Text>
                  </Stack>
                </Grid.Col>
                <Grid.Col span={3}>
                  <Stack align="center" gap="xs">
                    <Text fw={600} size="xl">{bonusStats.most_popular_bonus || 'Нет'}</Text>
                    <Text size="sm" c="dimmed">Популярный</Text>
                  </Stack>
                </Grid.Col>
              </Grid>
            </Card.Section>
          </Card>
        )}

        {/* Табы */}
        <Tabs value={activeTab} onChange={(value) => setActiveTab(value || 'bonuses')}>
          <Tabs.List>
            <Tabs.Tab value="bonuses" leftSection={<IconGift size={16} />}>
              Бонусы
            </Tabs.Tab>
            <Tabs.Tab value="rules" leftSection={<IconSettings size={16} />}>
              Специальные правила
            </Tabs.Tab>
          </Tabs.List>

          {/* Таб бонусов */}
          <Tabs.Panel value="bonuses" pt="md">
            <Stack gap="md">
              <Group justify="space-between">
                <Title order={4}>Управление бонусами</Title>
                <Button
                  leftSection={<IconPlus size={16} />}
                  onClick={() => {
                    setEditingBonus(null)
                    bonusForm.reset()
                    setBonusModalOpened(true)
                  }}
                >
                  Создать бонус
                </Button>
              </Group>

              <Table>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Название</Table.Th>
                    <Table.Th>Тип</Table.Th>
                    <Table.Th>Значение</Table.Th>
                    <Table.Th>Использований</Table.Th>
                    <Table.Th>Статус</Table.Th>
                    <Table.Th>Действия</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {bonuses?.map((bonus) => (
                    <Table.Tr key={bonus.id}>
                      <Table.Td>
                        <Stack gap={2}>
                          <Text fw={500}>{bonus.name}</Text>
                          <Text size="sm" c="dimmed" lineClamp={1}>
                            {bonus.description}
                          </Text>
                        </Stack>
                      </Table.Td>
                      <Table.Td>
                        <Badge 
                          variant="light" 
                          color={getBonusTypeColor(bonus.type)}
                        >
                          {getBonusTypeLabel(bonus.type)}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm">
                          {bonus.type === 'points_multiplier' ? `${bonus.value}x` : bonus.value}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm">
                          {bonus.current_uses}
                          {bonus.max_uses && ` / ${bonus.max_uses}`}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Badge 
                          variant="light" 
                          color={bonus.is_active ? 'green' : 'red'}
                        >
                          {bonus.is_active ? 'Активен' : 'Неактивен'}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Group gap="xs">
                          <Tooltip label="Редактировать">
                            <ActionIcon
                              variant="light"
                              onClick={() => openBonusEdit(bonus)}
                            >
                              <IconEdit size={14} />
                            </ActionIcon>
                          </Tooltip>
                          <Tooltip label="Удалить">
                            <ActionIcon
                              variant="light"
                              color="red"
                              onClick={() => handleDeleteBonus(bonus.id)}
                            >
                              <IconTrash size={14} />
                            </ActionIcon>
                          </Tooltip>
                        </Group>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>

              {(!bonuses || bonuses.length === 0) && (
                <Alert icon={<IconInfoCircle size={16} />} title="Нет бонусов">
                  Создайте первый бонус для участников соревнований
                </Alert>
              )}
            </Stack>
          </Tabs.Panel>

          {/* Таб специальных правил */}
          <Tabs.Panel value="rules" pt="md">
            <Stack gap="md">
              <Group justify="space-between">
                <Title order={4}>Специальные правила</Title>
                <Button
                  leftSection={<IconPlus size={16} />}
                  onClick={() => {
                    setEditingRule(null)
                    ruleForm.reset()
                    setRuleModalOpened(true)
                  }}
                >
                  Создать правило
                </Button>
              </Group>

              <Table>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Название</Table.Th>
                    <Table.Th>Тип</Table.Th>
                    <Table.Th>Приоритет</Table.Th>
                    <Table.Th>Статус</Table.Th>
                    <Table.Th>Действия</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {specialRules?.map((rule) => (
                    <Table.Tr key={rule.id}>
                      <Table.Td>
                        <Stack gap={2}>
                          <Text fw={500}>{rule.name}</Text>
                          <Text size="sm" c="dimmed" lineClamp={1}>
                            {rule.description}
                          </Text>
                        </Stack>
                      </Table.Td>
                      <Table.Td>
                        <Badge variant="light" color="blue">
                          {rule.type}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm">{rule.priority}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Badge 
                          variant="light" 
                          color={rule.is_active ? 'green' : 'red'}
                        >
                          {rule.is_active ? 'Активно' : 'Неактивно'}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Group gap="xs">
                          <Tooltip label="Редактировать">
                            <ActionIcon
                              variant="light"
                              onClick={() => openRuleEdit(rule)}
                            >
                              <IconEdit size={14} />
                            </ActionIcon>
                          </Tooltip>
                          <Tooltip label="Удалить">
                            <ActionIcon
                              variant="light"
                              color="red"
                              onClick={() => handleDeleteSpecialRule(rule.id)}
                            >
                              <IconTrash size={14} />
                            </ActionIcon>
                          </Tooltip>
                        </Group>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>

              {(!specialRules || specialRules.length === 0) && (
                <Alert icon={<IconInfoCircle size={16} />} title="Нет специальных правил">
                  Создайте специальные правила для модификации системы подсчета очков
                </Alert>
              )}
            </Stack>
          </Tabs.Panel>
        </Tabs>

        {/* Модальное окно создания/редактирования бонуса */}
        <Modal
          opened={bonusModalOpened}
          onClose={() => {
            setBonusModalOpened(false)
            setEditingBonus(null)
            bonusForm.reset()
          }}
          title={editingBonus ? 'Редактировать бонус' : 'Создать бонус'}
          size="lg"
        >
          <form onSubmit={bonusForm.onSubmit(editingBonus ? handleUpdateBonus : handleCreateBonus)}>
            <Stack gap="md">
              <TextInput
                label="Название"
                placeholder="Введите название бонуса"
                required
                {...bonusForm.getInputProps('name')}
              />

              <Textarea
                label="Описание"
                placeholder="Опишите условия получения бонуса"
                required
                {...bonusForm.getInputProps('description')}
              />

              <Select
                label="Тип бонуса"
                placeholder="Выберите тип бонуса"
                required
                data={[
                  { value: 'points_multiplier', label: 'Множитель очков' },
                  { value: 'rating_boost', label: 'Увеличение рейтинга' },
                  { value: 'achievement_unlock', label: 'Разблокировка достижения' },
                  { value: 'special_title', label: 'Специальный титул' },
                  { value: 'exclusive_access', label: 'Эксклюзивный доступ' },
                  { value: 'custom_reward', label: 'Пользовательская награда' }
                ]}
                {...bonusForm.getInputProps('type')}
              />

              <NumberInput
                label="Значение"
                placeholder="Введите значение бонуса"
                required
                {...bonusForm.getInputProps('value')}
              />

              <Select
                label="Лига"
                placeholder="Выберите лигу (необязательно)"
                data={(activeLeagues || []).map(league => ({
                  value: league.id,
                  label: `${league.name} (${league.season})`
                }))}
                clearable
                {...bonusForm.getInputProps('league_id')}
              />

              <NumberInput
                label="Максимальное количество использований"
                placeholder="Оставьте пустым для неограниченного использования"
                min={1}
                {...bonusForm.getInputProps('max_uses')}
              />

              <DatePickerInput
                label="Дата истечения"
                placeholder="Выберите дату истечения (необязательно)"
                {...bonusForm.getInputProps('expires_at')}
              />

              <Group justify="flex-end" gap="sm">
                <Button variant="light" onClick={() => setBonusModalOpened(false)}>
                  Отмена
                </Button>
                <Button type="submit" loading={createBonus.isPending || updateBonus.isPending}>
                  {editingBonus ? 'Сохранить' : 'Создать'}
                </Button>
              </Group>
            </Stack>
          </form>
        </Modal>

        {/* Модальное окно создания/редактирования специального правила */}
        <Modal
          opened={ruleModalOpened}
          onClose={() => {
            setRuleModalOpened(false)
            setEditingRule(null)
            ruleForm.reset()
          }}
          title={editingRule ? 'Редактировать специальное правило' : 'Создать специальное правило'}
          size="lg"
        >
          <form onSubmit={ruleForm.onSubmit(editingRule ? handleUpdateSpecialRule : handleCreateSpecialRule)}>
            <Stack gap="md">
              <TextInput
                label="Название"
                placeholder="Введите название правила"
                required
                {...ruleForm.getInputProps('name')}
              />

              <Textarea
                label="Описание"
                placeholder="Опишите правило"
                required
                {...ruleForm.getInputProps('description')}
              />

              <Select
                label="Тип правила"
                placeholder="Выберите тип правила"
                required
                data={[
                  { value: 'scoring_modifier', label: 'Модификатор подсчета очков' },
                  { value: 'participation_requirement', label: 'Требование участия' },
                  { value: 'bonus_trigger', label: 'Триггер бонуса' },
                  { value: 'penalty_rule', label: 'Правило штрафа' },
                  { value: 'custom', label: 'Пользовательское правило' }
                ]}
                {...ruleForm.getInputProps('type')}
              />

              <NumberInput
                label="Приоритет"
                placeholder="Введите приоритет (чем выше, тем раньше применяется)"
                required
                min={1}
                {...ruleForm.getInputProps('priority')}
              />

              <Select
                label="Лига"
                placeholder="Выберите лигу (необязательно)"
                data={(activeLeagues || []).map(league => ({
                  value: league.id,
                  label: `${league.name} (${league.season})`
                }))}
                clearable
                {...ruleForm.getInputProps('league_id')}
              />

              <Group justify="flex-end" gap="sm">
                <Button variant="light" onClick={() => setRuleModalOpened(false)}>
                  Отмена
                </Button>
                <Button type="submit" loading={createSpecialRule.isPending || updateSpecialRule.isPending}>
                  {editingRule ? 'Сохранить' : 'Создать'}
                </Button>
              </Group>
            </Stack>
          </form>
        </Modal>
      </Stack>
    </Container>
  )
}
