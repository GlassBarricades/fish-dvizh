import { useState } from 'react'
import { ActionIcon, Button, Card, Group, Modal, Stack, Table, TextInput, Title } from '@mantine/core'
import { IconPencil, IconTrash } from '@tabler/icons-react'
import { notifications } from '@mantine/notifications'
import { useBaitManufacturers, useCreateBaitManufacturer, useDeleteBaitManufacturer, useUpdateBaitManufacturer } from '../../features/dicts/baitManufacturers/hooks'

export default function BaitManufacturersPage() {
  const { data } = useBaitManufacturers()
  const { mutateAsync: createManuf, isPending: creating } = useCreateBaitManufacturer()
  const { mutateAsync: updateManuf, isPending: updating } = useUpdateBaitManufacturer()
  const { mutateAsync: deleteManuf, isPending: deleting } = useDeleteBaitManufacturer()

  const [opened, setOpened] = useState(false)
  const [edit, setEdit] = useState<{ id?: string; name: string }>({ name: '' })

  const rows = (data ?? []).map((m) => (
    <tr key={m.id}>
      <td>{m.name}</td>
      <td style={{ width: 120 }}>
        <Group gap="xs" justify="flex-end">
          <ActionIcon variant="subtle" onClick={() => { setEdit({ id: m.id, name: m.name }); setOpened(true) }}>
            <IconPencil size={16} />
          </ActionIcon>
          <ActionIcon variant="subtle" color="red" onClick={async () => { await deleteManuf(m.id); notifications.show({ color: 'gray', message: 'Удалено' }) }} loading={deleting}>
            <IconTrash size={16} />
          </ActionIcon>
        </Group>
      </td>
    </tr>
  ))

  return (
    <Card withBorder p="lg">
      <Group justify="space-between" mb="md">
        <Title order={3}>Производители приманок</Title>
        <Button onClick={() => { setEdit({ name: '' }); setOpened(true) }}>Добавить</Button>
      </Group>
      <Table withTableBorder withColumnBorders striped highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Название</Table.Th>
            <Table.Th style={{ width: 200 }}></Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>{rows}</Table.Tbody>
      </Table>

      <Modal opened={opened} onClose={() => setOpened(false)} title={edit.id ? 'Редактировать производителя' : 'Добавить производителя'}>
        <Stack>
          <TextInput label="Название" value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.currentTarget.value })} required />
          <Group justify="flex-end">
            <Button variant="outline" onClick={() => setOpened(false)}>Отмена</Button>
            <Button loading={creating || updating} onClick={async () => {
              const name = edit.name.trim()
              if (!name) return
              if (edit.id) {
                await updateManuf({ id: edit.id, name })
                notifications.show({ color: 'green', message: 'Сохранено' })
              } else {
                await createManuf(name)
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


