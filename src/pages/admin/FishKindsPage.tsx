import { ActionIcon, Button, Card, Group, Loader, Modal, Table, Text, TextInput, Title } from '@mantine/core'
import { IconPencil, IconTrash } from '@tabler/icons-react'
import { useDisclosure } from '@mantine/hooks'
import { useCreateFishKind, useDeleteFishKind, useFishKinds, useUpdateFishKind } from '@/features/dicts/fish/hooks'
import { useState } from 'react'
import { notifications } from '@mantine/notifications'

export default function FishKindsPage() {
  const { data, isLoading, isError, error } = useFishKinds()
  const { mutateAsync: createKind } = useCreateFishKind()
  const { mutateAsync: updateKind } = useUpdateFishKind()
  const { mutateAsync: deleteKind } = useDeleteFishKind()
  const [opened, { open, close }] = useDisclosure(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [name, setName] = useState('')

  function startCreate() {
    setEditingId(null)
    setName('')
    open()
  }

  function startEdit(id: string, current: string) {
    setEditingId(id)
    setName(current)
    open()
  }

  async function handleSubmit() {
    try {
      if (name.trim().length === 0) return
      if (editingId) await updateKind({ id: editingId, name: name.trim() })
      else await createKind(name.trim())
      close()
      notifications.show({ color: 'green', message: 'Сохранено' })
    } catch (e: any) {
      notifications.show({ color: 'red', message: e?.message ?? 'Ошибка' })
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteKind(id)
      notifications.show({ color: 'green', message: 'Удалено' })
    } catch (e: any) {
      notifications.show({ color: 'red', message: e?.message ?? 'Ошибка удаления' })
    }
  }

  return (
    <Card withBorder padding="lg" radius="md">
      <Group justify="space-between" mb="md">
        <Title order={3}>Виды рыбы</Title>
        <Button onClick={startCreate}>Добавить</Button>
      </Group>
      {isLoading && <Loader />}
      {isError && <Text c="red">{(error as any)?.message ?? 'Ошибка загрузки'}</Text>}
      {!isLoading && !isError && (
        <Table striped highlightOnHover withTableBorder withColumnBorders>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Название</Table.Th>
              <Table.Th style={{ width: 100 }}></Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {data?.map((row) => (
              <Table.Tr key={row.id}>
                <Table.Td>{row.name}</Table.Td>
                <Table.Td>
                  <Group gap="xs" justify="flex-end">
                    <ActionIcon variant="subtle" onClick={() => startEdit(row.id, row.name)}>
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

      <Modal opened={opened} onClose={close} title={editingId ? 'Редактировать вид рыбы' : 'Новый вид рыбы'}>
        <TextInput label="Название" value={name} onChange={(e) => setName(e.currentTarget.value)} autoFocus />
        <Group justify="flex-end" mt="md">
          <Button variant="subtle" onClick={close}>Отмена</Button>
          <Button onClick={handleSubmit}>Сохранить</Button>
        </Group>
      </Modal>
    </Card>
  )
}



