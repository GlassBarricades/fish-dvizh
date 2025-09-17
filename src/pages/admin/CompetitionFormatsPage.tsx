import { useState } from 'react'
import {
  ActionIcon,
  Button,
  Group,
  Modal,
  Stack,
  Table,
  Text,
  TextInput,
  Textarea,
  Title,
} from '@mantine/core'
import { IconEdit, IconPlus, IconTrash } from '@tabler/icons-react'
import { useCompetitionFormats, useCreateCompetitionFormat, useDeleteCompetitionFormat, useUpdateCompetitionFormat } from '@/features/dicts/formats/hooks'
import { modals } from '@mantine/modals'
import { notifications } from '@mantine/notifications'

export default function CompetitionFormatsPage() {
  const { data: formats, isLoading } = useCompetitionFormats()
  const { mutateAsync: createFormat, isPending: isCreating } = useCreateCompetitionFormat()
  const { mutateAsync: updateFormat, isPending: isUpdating } = useUpdateCompetitionFormat()
  const { mutateAsync: deleteFormat } = useDeleteCompetitionFormat()

  const [editingFormat, setEditingFormat] = useState<{ id: string; name: string; description: string; rules: string } | null>(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  const handleCreate = async (values: { name: string; description: string; rules: string }) => {
    try {
      await createFormat({
        name: values.name.trim(),
        description: values.description.trim() || undefined,
        rules: values.rules.trim() || undefined,
      })
      notifications.show({ color: 'green', message: 'Формат создан' })
      setIsCreateModalOpen(false)
    } catch (e: any) {
      notifications.show({ color: 'red', message: e?.message ?? 'Ошибка создания' })
    }
  }

  const handleUpdate = async (values: { name: string; description: string; rules: string }) => {
    if (!editingFormat) return
    try {
      await updateFormat({
        id: editingFormat.id,
        input: {
          name: values.name.trim(),
          description: values.description.trim() || undefined,
          rules: values.rules.trim() || undefined,
        },
      })
      notifications.show({ color: 'green', message: 'Формат обновлен' })
      setEditingFormat(null)
    } catch (e: any) {
      notifications.show({ color: 'red', message: e?.message ?? 'Ошибка обновления' })
    }
  }

  const handleDelete = (id: string, name: string) => {
    modals.openConfirmModal({
      title: 'Удаление формата',
      children: <Text>Вы уверены, что хотите удалить формат "{name}"?</Text>,
      labels: { confirm: 'Удалить', cancel: 'Отмена' },
      confirmProps: { color: 'red' },
      onConfirm: async () => {
        try {
          await deleteFormat(id)
          notifications.show({ color: 'green', message: 'Формат удален' })
        } catch (e: any) {
          notifications.show({ color: 'red', message: e?.message ?? 'Ошибка удаления' })
        }
      },
    })
  }

  if (isLoading) return <Text>Загрузка...</Text>

  return (
    <Stack gap="md">
      <Group justify="space-between">
        <Title order={2}>Форматы соревнований</Title>
        <Button leftSection={<IconPlus size={16} />} onClick={() => setIsCreateModalOpen(true)}>
          Добавить формат
        </Button>
      </Group>

      <Table>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Название</Table.Th>
            <Table.Th>Описание</Table.Th>
            <Table.Th>Правила</Table.Th>
            <Table.Th>Действия</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {formats?.map((format) => (
            <Table.Tr key={format.id}>
              <Table.Td>{format.name}</Table.Td>
              <Table.Td>{format.description || '-'}</Table.Td>
              <Table.Td>{format.rules || '-'}</Table.Td>
              <Table.Td>
                <Group gap="xs">
                  <ActionIcon
                    variant="subtle"
                    color="blue"
                    onClick={() =>
                      setEditingFormat({
                        id: format.id,
                        name: format.name,
                        description: format.description || '',
                        rules: format.rules || '',
                      })
                    }
                  >
                    <IconEdit size={16} />
                  </ActionIcon>
                  <ActionIcon
                    variant="subtle"
                    color="red"
                    onClick={() => handleDelete(format.id, format.name)}
                  >
                    <IconTrash size={16} />
                  </ActionIcon>
                </Group>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>

      {/* Create Modal */}
      <Modal opened={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Новый формат">
        <CreateFormatForm onSubmit={handleCreate} isSubmitting={isCreating} />
      </Modal>

      {/* Edit Modal */}
      <Modal opened={!!editingFormat} onClose={() => setEditingFormat(null)} title="Редактировать формат">
        {editingFormat && (
          <EditFormatForm
            format={editingFormat}
            onSubmit={handleUpdate}
            isSubmitting={isUpdating}
          />
        )}
      </Modal>
    </Stack>
  )
}

function CreateFormatForm({ onSubmit, isSubmitting }: { onSubmit: (values: { name: string; description: string; rules: string }) => void; isSubmitting: boolean }) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [rules, setRules] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      notifications.show({ color: 'red', message: 'Введите название формата' })
      return
    }
    onSubmit({ name, description, rules })
  }

  return (
    <form onSubmit={handleSubmit}>
      <Stack gap="md">
        <TextInput
          label="Название"
          placeholder="Введите название формата"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <Textarea
          label="Описание"
          placeholder="Описание формата (опционально)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
        />
        <Textarea
          label="Правила"
          placeholder="Правила проведения (опционально)"
          value={rules}
          onChange={(e) => setRules(e.target.value)}
          rows={5}
        />
        <Group justify="flex-end">
          <Button type="submit" loading={isSubmitting}>
            Создать
          </Button>
        </Group>
      </Stack>
    </form>
  )
}

function EditFormatForm({
  format,
  onSubmit,
  isSubmitting,
}: {
  format: { id: string; name: string; description: string; rules: string }
  onSubmit: (values: { name: string; description: string; rules: string }) => void
  isSubmitting: boolean
}) {
  const [name, setName] = useState(format.name)
  const [description, setDescription] = useState(format.description)
  const [rules, setRules] = useState(format.rules)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      notifications.show({ color: 'red', message: 'Введите название формата' })
      return
    }
    onSubmit({ name, description, rules })
  }

  return (
    <form onSubmit={handleSubmit}>
      <Stack gap="md">
        <TextInput
          label="Название"
          placeholder="Введите название формата"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <Textarea
          label="Описание"
          placeholder="Описание формата (опционально)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
        />
        <Textarea
          label="Правила"
          placeholder="Правила проведения (опционально)"
          value={rules}
          onChange={(e) => setRules(e.target.value)}
          rows={5}
        />
        <Group justify="flex-end">
          <Button type="submit" loading={isSubmitting}>
            Сохранить
          </Button>
        </Group>
      </Stack>
    </form>
  )
}
