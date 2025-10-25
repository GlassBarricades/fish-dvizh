import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Container,
  Stack,
  Title,
  Text,
  Paper,
  Group,
  Badge,
  Button,
  SimpleGrid,
  Card,
  Image,
  ThemeIcon,
  Modal,
  TextInput,
  Textarea,
  Select
} from '@mantine/core'
import { IconPlus, IconCalendar, IconTrophy, IconEdit, IconTrash } from '@tabler/icons-react'
import { useAuth } from '@/features/auth/hooks'
import { useLeagues, useCreateLeague, useUpdateLeague, useDeleteLeague } from '@/features/leagues/hooks'
import { useRatingConfigs as useRatingConfigsHook } from '@/features/leagues/hooks'
import { LeagueImageUploader } from '@/components/ImageUploader'
import dayjs from 'dayjs'

export default function LeaguesPage() {
  const { role } = useAuth()
  const [createModalOpened, setCreateModalOpened] = useState(false)
  const [editModalOpened, setEditModalOpened] = useState(false)
  const [deleteConfirmOpened, setDeleteConfirmOpened] = useState(false)
  const [editingLeagueId, setEditingLeagueId] = useState<string | null>(null)
  const [deletingLeagueId, setDeletingLeagueId] = useState<string | null>(null)
  const [newLeague, setNewLeague] = useState({
    name: '',
    description: '',
    season: '',
    start_date: '',
    end_date: '',
    rating_config_id: '',
    image_url: ''
  })

  const { data: leagues, isLoading } = useLeagues()
  const { data: ratingConfigs } = useRatingConfigsHook()
  const createLeague = useCreateLeague()
  const updateLeague = useUpdateLeague()
  const deleteLeague = useDeleteLeague()

  const handleCreateLeague = async () => {
    if (!newLeague.name || !newLeague.season || !newLeague.start_date || !newLeague.end_date || !newLeague.rating_config_id) {
      return
    }

    await createLeague.mutateAsync(newLeague)
    setCreateModalOpened(false)
    setNewLeague({
      name: '',
      description: '',
      season: '',
      start_date: '',
      end_date: '',
      rating_config_id: '',
      image_url: ''
    })
  }


  const handleUpdateLeague = async () => {
    if (!editingLeagueId) return
    await updateLeague.mutateAsync({
      leagueId: editingLeagueId,
      input: newLeague
    })
    setEditModalOpened(false)
    setEditingLeagueId(null)
  }

  const handleDeleteLeague = (leagueId: string) => {
    setDeletingLeagueId(leagueId)
    setDeleteConfirmOpened(true)
  }

  const confirmDeleteLeague = async () => {
    if (!deletingLeagueId) return
    await deleteLeague.mutateAsync(deletingLeagueId)
    setDeleteConfirmOpened(false)
    setDeletingLeagueId(null)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'green'
      case 'upcoming': return 'yellow'
      case 'finished': return 'gray'
      default: return 'gray'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'Активна'
      case 'upcoming': return 'Предстоящая'
      case 'finished': return 'Завершена'
      default: return 'Неизвестно'
    }
  }

  const canCreateLeague = role === 'admin' || role === 'organizer'

  return (
    <Container size="lg" py="md">
      <Stack gap="lg">
        {/* Заголовок */}
        <Paper withBorder radius="md" p="lg">
          <Group justify="space-between" align="center">
            <Stack gap="xs">
              <Title order={2}>Лиги рыболовных соревнований</Title>
              <Text c="dimmed">Участвуйте в сезонных турнирах и соревнуйтесь за звание лучшего рыболова</Text>
            </Stack>
            {canCreateLeague && (
              <Button 
                leftSection={<IconPlus size={16} />}
                onClick={() => setCreateModalOpened(true)}
              >
                Создать лигу
              </Button>
            )}
          </Group>
        </Paper>

        {/* Список лиг */}
        {isLoading ? (
          <Text>Загрузка лиг...</Text>
        ) : (
          <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md">
            {(leagues ?? []).map((league) => (
              <Card key={league.id} withBorder radius="md" p="sm" component="a" href={`/league/${league.id}`}>
                <Card.Section>
                  <Image 
                    src={league.image_url || "/placeholder-league.jpg"} 
                    alt={league.name} 
                    h={140} 
                    fallbackSrc="/vite.svg" 
                  />
                </Card.Section>
                <Stack gap={6} mt="sm">
                  <Group justify="space-between">
                    <Title order={5}>{league.name}</Title>
                    <Badge variant="light" color={getStatusColor(league.status)}>
                      {getStatusLabel(league.status)}
                    </Badge>
                  </Group>
                  
                  <Group gap="xs">
                    <Badge variant="light" color="blue" size="sm">
                      {league.season}
                    </Badge>
                  </Group>

                  {league.description && (
                    <Text size="sm" c="dimmed" lineClamp={2}>
                      {league.description}
                    </Text>
                  )}

                  <Group gap="sm" c="dimmed">
                    <Group gap={4}>
                      <IconCalendar size={14} />
                      <Text size="xs">
                        {dayjs(league.start_date).format('DD.MM')} - {dayjs(league.end_date).format('DD.MM.YYYY')}
                      </Text>
                    </Group>
                  </Group>

                  <Group justify="flex-end">
                    <Button 
                      size="xs" 
                      variant="light"
                      component={Link}
                      to={`/league/${league.id}`}
                    >
                      Подробнее
                    </Button>
                    {canCreateLeague && (
                      <Group gap="xs">
                        <Button 
                          size="xs" 
                          variant="light" 
                          color="blue"
                          leftSection={<IconEdit size={12} />}
                          component={Link}
                          to={`/admin/league/${league.id}`}
                        >
                          Редактировать
                        </Button>
                        <Button 
                          size="xs" 
                          variant="light" 
                          color="red"
                          leftSection={<IconTrash size={12} />}
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            handleDeleteLeague(league.id)
                          }}
                        >
                          Удалить
                        </Button>
                      </Group>
                    )}
                  </Group>
                </Stack>
              </Card>
            ))}
            
            {leagues && leagues.length === 0 && (
              <Card withBorder radius="md" p="lg" style={{ gridColumn: '1 / -1' }}>
                <Stack align="center" gap="md">
                  <ThemeIcon size={64} radius="xl" variant="light" color="gray">
                    <IconTrophy size={32} />
                  </ThemeIcon>
                  <Stack align="center" gap="xs">
                    <Title order={4}>Пока нет активных лиг</Title>
                    <Text c="dimmed" ta="center">
                      Создайте первую лигу или дождитесь объявления новых турниров
                    </Text>
                  </Stack>
                  {canCreateLeague && (
                    <Button 
                      leftSection={<IconPlus size={16} />}
                      onClick={() => setCreateModalOpened(true)}
                    >
                      Создать первую лигу
                    </Button>
                  )}
                </Stack>
              </Card>
            )}
          </SimpleGrid>
        )}
      </Stack>

      {/* Модальное окно создания лиги */}
      <Modal
        opened={createModalOpened}
        onClose={() => setCreateModalOpened(false)}
        title="Создать новую лигу"
        size="md"
        centered
      >
        <Stack gap="md">
          <TextInput
            label="Название лиги"
            placeholder="Весенняя лига 2024"
            value={newLeague.name}
            onChange={(e) => setNewLeague({ ...newLeague, name: e.target.value })}
            required
          />

          <Textarea
            label="Описание"
            placeholder="Описание лиги и правил участия"
            value={newLeague.description}
            onChange={(e) => setNewLeague({ ...newLeague, description: e.target.value })}
            minRows={3}
          />

          <Select
            label="Сезон"
            placeholder="Выберите сезон"
            data={[
              { value: '2024-spring', label: 'Весна 2024' },
              { value: '2024-summer', label: 'Лето 2024' },
              { value: '2024-autumn', label: 'Осень 2024' },
              { value: '2024-winter', label: 'Зима 2024' }
            ]}
            value={newLeague.season}
            onChange={(value) => setNewLeague({ ...newLeague, season: value || '' })}
            required
          />

          <Group grow>
            <TextInput
              label="Дата начала"
              type="date"
              value={newLeague.start_date}
              onChange={(e) => setNewLeague({ ...newLeague, start_date: e.target.value })}
              required
            />
            <TextInput
              label="Дата окончания"
              type="date"
              value={newLeague.end_date}
              onChange={(e) => setNewLeague({ ...newLeague, end_date: e.target.value })}
              required
            />
          </Group>

          <Select
            label="Система рейтинга"
            placeholder="Выберите конфигурацию рейтинга"
            data={(ratingConfigs ?? []).map(config => ({
              value: config.id,
              label: config.name
            }))}
            value={newLeague.rating_config_id}
            onChange={(value) => setNewLeague({ ...newLeague, rating_config_id: value || '' })}
            required
          />

          <LeagueImageUploader
            leagueId="new"
            currentImage={newLeague.image_url}
            onImageChange={(url) => setNewLeague({ ...newLeague, image_url: url })}
          />

          <Group justify="flex-end" gap="sm">
            <Button variant="light" onClick={() => setCreateModalOpened(false)}>
              Отмена
            </Button>
            <Button 
              onClick={handleCreateLeague}
              loading={createLeague.isPending}
              disabled={!newLeague.name || !newLeague.season || !newLeague.start_date || !newLeague.end_date || !newLeague.rating_config_id}
            >
              Создать лигу
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Модальное окно редактирования лиги */}
      <Modal
        opened={editModalOpened}
        onClose={() => setEditModalOpened(false)}
        title="Редактировать лигу"
        size="md"
        centered
      >
        <Stack gap="md">
          <TextInput
            label="Название лиги"
            placeholder="Весенняя лига 2024"
            value={newLeague.name}
            onChange={(e) => setNewLeague({ ...newLeague, name: e.target.value })}
            required
          />

          <Textarea
            label="Описание"
            placeholder="Описание лиги и правил участия"
            value={newLeague.description}
            onChange={(e) => setNewLeague({ ...newLeague, description: e.target.value })}
            minRows={3}
          />

          <Select
            label="Сезон"
            placeholder="Выберите сезон"
            data={[
              { value: '2024-spring', label: 'Весна 2024' },
              { value: '2024-summer', label: 'Лето 2024' },
              { value: '2024-autumn', label: 'Осень 2024' },
              { value: '2024-winter', label: 'Зима 2024' }
            ]}
            value={newLeague.season}
            onChange={(value) => setNewLeague({ ...newLeague, season: value || '' })}
            required
          />

          <Group grow>
            <TextInput
              label="Дата начала"
              type="date"
              value={newLeague.start_date}
              onChange={(e) => setNewLeague({ ...newLeague, start_date: e.target.value })}
              required
            />
            <TextInput
              label="Дата окончания"
              type="date"
              value={newLeague.end_date}
              onChange={(e) => setNewLeague({ ...newLeague, end_date: e.target.value })}
              required
            />
          </Group>

          <Select
            label="Система рейтинга"
            placeholder="Выберите конфигурацию рейтинга"
            data={(ratingConfigs ?? []).map(config => ({
              value: config.id,
              label: config.name
            }))}
            value={newLeague.rating_config_id}
            onChange={(value) => setNewLeague({ ...newLeague, rating_config_id: value || '' })}
            required
          />

          <LeagueImageUploader
            leagueId={editingLeagueId || 'new'}
            currentImage={newLeague.image_url}
            onImageChange={(url) => setNewLeague({ ...newLeague, image_url: url })}
          />

          <Group justify="flex-end" gap="sm">
            <Button variant="light" onClick={() => setEditModalOpened(false)}>
              Отмена
            </Button>
            <Button 
              onClick={handleUpdateLeague}
              loading={updateLeague.isPending}
              disabled={!newLeague.name || !newLeague.season || !newLeague.start_date || !newLeague.end_date || !newLeague.rating_config_id}
            >
              Сохранить изменения
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Модальное окно подтверждения удаления */}
      <Modal
        opened={deleteConfirmOpened}
        onClose={() => setDeleteConfirmOpened(false)}
        title="Подтверждение удаления"
        centered
      >
        <Stack gap="md">
          <Text>
            Вы уверены, что хотите удалить лигу? Это действие нельзя отменить.
          </Text>
          <Text size="sm" c="red">
            Внимание: При удалении лиги также будут удалены все связанные данные (участия, результаты, рейтинги).
          </Text>
          <Group justify="flex-end" gap="sm">
            <Button variant="light" onClick={() => setDeleteConfirmOpened(false)}>
              Отмена
            </Button>
            <Button 
              color="red"
              onClick={confirmDeleteLeague}
              loading={deleteLeague.isPending}
            >
              Удалить лигу
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Container>
  )
}
