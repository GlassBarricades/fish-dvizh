import { ActionIcon, Button, Card, Group, Loader, Modal, NumberInput, Table, Text, TextInput, Title } from '@mantine/core'
import { IconPencil, IconTrash } from '@tabler/icons-react'
import { useDisclosure } from '@mantine/hooks'
import { useCreateTeamSize, useDeleteTeamSize, useTeamSizes, useUpdateTeamSize } from '../../features/dicts/teamSizes/hooks'
import { useState } from 'react'
import { notifications } from '@mantine/notifications'

export default function TeamSizesPage() {
  const { data, isLoading, isError, error } = useTeamSizes()
  const { mutateAsync: createSize } = useCreateTeamSize()
  const { mutateAsync: updateSize } = useUpdateTeamSize()
  const { mutateAsync: deleteSize } = useDeleteTeamSize()
  const [opened, { open, close }] = useDisclosure(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [size, setSize] = useState<number | ''>(1)

  function startCreate() {
    setEditingId(null)
    setName('')
    setSize(1)
    open()
  }

  function startEdit(id: string, currentName: string, currentSize: number) {
    setEditingId(id)
    setName(currentName)
    setSize(currentSize)
    open()
  }

  async function handleSubmit() {
    try {
      if (name.trim().length === 0 || !size || size < 1) return
      if (editingId) await updateSize({ id: editingId, input: { name: name.trim(), size: Number(size) } })
      else await createSize({ name: name.trim(), size: Number(size) })
      close()
      notifications.show({ color: 'green', message: 'Сохранено' })
    } catch (e: any) {
      notifications.show({ color: 'red', message: e?.message ?? 'Ошибка' })
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteSize(id)
      notifications.show({ color: 'green', message: 'Удалено' })
    } catch (e: any) {
      notifications.show({ color: 'red', message: e?.message ?? 'Ошибка удаления' })
    }
  }

  return (
    <Card withBorder padding="lg" radius="md">
      <Group justify="space-between" mb="md">
        <Title order={3}>Размеры команд</Title>
        <Button onClick={startCreate}>Добавить</Button>
      </Group>
      {isLoading && <Loader />}
      {isError && <Text c="red">{(error as any)?.message ?? 'Ошибка загрузки'}</Text>}
      {!isLoading && !isError && (
        <Table striped highlightOnHover withTableBorder withColumnBorders>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Название</Table.Th>
              <Table.Th style={{ width: 120 }}>Кол-во</Table.Th>
              <Table.Th style={{ width: 100 }}></Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {data?.map((row) => (
              <Table.Tr key={row.id}>
                <Table.Td>{row.name}</Table.Td>
                <Table.Td>{row.size}</Table.Td>
                <Table.Td>
                  <Group gap="xs" justify="flex-end">
                    <ActionIcon variant="subtle" onClick={() => startEdit(row.id, row.name, row.size)}>
                      <IconPencil size={16} />
                    </ActionIcon>
                    <ActionIcon variant="subtle" color="red" onClick={() => handleDelete(row.id)}>
                      <IconTrash size={16} />
                    </ActionIcon>
                  </Group>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      )}

      <Modal opened={opened} onClose={close} title={editingId ? 'Редактировать размер команды' : 'Новый размер команды'}>
        <TextInput label="Название" value={name} onChange={(e) => setName(e.currentTarget.value)} autoFocus />
        <NumberInput label="Количество участников" value={size} onChange={(v) => setSize(v === '' ? '' : Number(v))} min={1} step={1} />
        <Group justify="flex-end" mt="md">
          <Button variant="subtle" onClick={close}>Отмена</Button>
          <Button onClick={handleSubmit}>Сохранить</Button>
        </Group>
      </Modal>
    </Card>
  )
}


