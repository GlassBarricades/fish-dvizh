import { useState } from 'react'
import { ActionIcon, Button, Card, Group, Modal, Stack, Table, TextInput, Title } from '@mantine/core'
import { IconPencil, IconTrash } from '@tabler/icons-react'
import { notifications } from '@mantine/notifications'
import { useBaitTypes, useCreateBaitType, useDeleteBaitType, useUpdateBaitType } from '@/features/dicts/baitTypes/hooks'

export default function BaitTypesPage() {
  const { data } = useBaitTypes()
  const { mutateAsync: createType, isPending: creating } = useCreateBaitType()
  const { mutateAsync: updateType, isPending: updating } = useUpdateBaitType()
  const { mutateAsync: deleteType, isPending: deleting } = useDeleteBaitType()

  const [opened, setOpened] = useState(false)
  const [edit, setEdit] = useState<{ id?: string; name: string }>({ name: '' })

  const rows = (data ?? []).map((t) => (
    <tr key={t.id}>
      <td>{t.name}</td>
      <td style={{ width: 120 }}>
        <Group gap="xs" justify="flex-end">
          <ActionIcon variant="subtle" onClick={() => { setEdit({ id: t.id, name: t.name }); setOpened(true) }}>
            <IconPencil size={16} />
          </ActionIcon>
          <ActionIcon variant="subtle" color="red" onClick={async () => { await deleteType(t.id); notifications.show({ color: 'gray', message: 'Удалено' }) }} loading={deleting}>
            <IconTrash size={16} />
          </ActionIcon>
        </Group>
      </td>
    </tr>
  ))

  return (
    <Card withBorder p="lg">
      <Group justify="space-between" mb="md">
        <Title order={3}>Типы приманок</Title>
        <Button onClick={() => { setEdit({ name: '' }); setOpened(true) }}>Добавить</Button>
      </Group>
      <Table withTableBorder withColumnBorders striped highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Название</Table.Th>
            <Table.Th style={{ width: 120 }}></Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>{rows}</Table.Tbody>
      </Table>

      <Modal opened={opened} onClose={() => setOpened(false)} title={edit.id ? 'Редактировать тип' : 'Добавить тип'}>
        <Stack>
          <TextInput label="Название" value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.currentTarget.value })} required />
          <Group justify="flex-end">
            <Button variant="outline" onClick={() => setOpened(false)}>Отмена</Button>
            <Button loading={creating || updating} onClick={async () => {
              const name = edit.name.trim()
              if (!name) return
              if (edit.id) {
                await updateType({ id: edit.id, name })
                notifications.show({ color: 'green', message: 'Сохранено' })
              } else {
                await createType(name)
                notifications.show({ color: 'green', message: 'Добавлено' })
              }
              setOpened(false)
            }}>Сохранить</Button>
          </Group>
        </Stack>
      </Modal>
    </Card>
  )
}


