import { useState } from 'react'
import { Paper, Stack, Title, Text, Button, Group, Card, Modal } from '@mantine/core'
import { useAuth } from '@/features/auth/hooks'
import { useProfilePageVM } from '@/features/profile/model/useProfilePageVM'
import { useNavigate } from 'react-router-dom'
import { notifications } from '@mantine/notifications'
import CreateSoloTrainingForm from './components/CreateSoloTrainingForm'
import EditSoloTrainingForm from './components/EditSoloTrainingForm'

export default function TrainingsPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  
  const {
    trainings,
    createTraining,
    deleteTraining,
    updateTraining,
    isCreatingTraining,
    isDeletingTraining,
    isUpdatingTraining,
  } = useProfilePageVM(user?.id)

  const [isEditTrainingModalOpen, setIsEditTrainingModalOpen] = useState(false)
  const [editingTraining, setEditingTraining] = useState<any>(null)

  const handleEditTraining = async (values: any) => {
    if (!editingTraining) return
    try {
      await updateTraining({
        id: editingTraining.id,
        input: {
          title: values.title,
          description: values.description || undefined,
          starts_at: values.starts_at,
          ends_at: values.ends_at || undefined,
          lat: values.lat ?? null,
          lng: values.lng ?? null,
          area_points: values.area_points ?? null,
          target_fish_kinds: values.target_fish_kinds ?? null,
        }
      })
      setIsEditTrainingModalOpen(false)
      setEditingTraining(null)
    } catch (e: any) {
      // Error handled in VM
    }
  }

  return (
    <>
      <Paper p="xl" withBorder>
        <Stack gap="md">
          <Title order={2}>Личные тренировки</Title>
          
          <Card withBorder>
            <CreateSoloTrainingForm
              onCreate={async (values) => {
                if (!user) return
                try {
                  await createTraining({
                    type: 'solo',
                    title: values.title,
                    description: values.description || undefined,
                    starts_at: values.starts_at,
                    ends_at: values.ends_at || undefined,
                    lat: values.lat ?? null,
                    lng: values.lng ?? null,
                    target_fish_kinds: values.target_fish_kinds || null,
                    user_id: user.id,
                    created_by: user.id,
                  })
                } catch (e: any) {
                  // Error handled in VM
                }
              }}
              isSubmitting={isCreatingTraining}
            />
          </Card>

          {(trainings ?? []).length === 0 ? (
            <Text c="dimmed">Личных тренировок пока нет</Text>
          ) : (
            <Stack gap="md">
              {trainings?.map((t) => (
                <Card key={t.id} withBorder>
                  <Group justify="space-between" align="flex-start">
                    <Stack gap={4}>
                      <Title order={5}>{t.title}</Title>
                      {t.description && <Text size="sm" c="dimmed">{t.description}</Text>}
                      <Text size="sm" c="dimmed">Начало: {new Date(t.starts_at).toLocaleString('ru-RU')}</Text>
                      {t.ends_at && <Text size="sm" c="dimmed">Окончание: {new Date(t.ends_at).toLocaleString('ru-RU')}</Text>}
                      {(t.lat && t.lng) && (
                        <Text size="sm" c="dimmed">Координаты: {t.lat?.toFixed(5)}, {t.lng?.toFixed(5)}</Text>
                      )}
                    </Stack>
                    <Group gap="xs">
                      <Button size="xs" variant="light" onClick={() => navigate(`/training/${t.id}`)}>
                        Открыть
                      </Button>
                      <Button size="xs" variant="light" color="blue" onClick={() => {
                        setEditingTraining(t)
                        setIsEditTrainingModalOpen(true)
                      }}>
                        Редактировать
                      </Button>
                      <Button color="red" variant="light" size="xs" onClick={async () => {
                        await deleteTraining(t.id)
                      }} loading={isDeletingTraining}>
                        Удалить
                      </Button>
                    </Group>
                  </Group>
                </Card>
              ))}
            </Stack>
          )}
        </Stack>
      </Paper>

      {/* Edit Training Modal */}
      <Modal 
        opened={isEditTrainingModalOpen} 
        onClose={() => {
          setIsEditTrainingModalOpen(false)
          setEditingTraining(null)
        }} 
        title="Редактировать тренировку"
        size="lg"
      >
        {editingTraining && (
          <EditSoloTrainingForm
            training={editingTraining}
            onEdit={handleEditTraining}
            isSubmitting={isUpdatingTraining}
          />
        )}
      </Modal>
    </>
  )
}
