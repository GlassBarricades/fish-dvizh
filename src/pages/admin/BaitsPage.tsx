import { useState } from 'react'
import { Button, Card, Group, Modal, Stack, Table, TextInput, Title, Select } from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { useBaits, useCreateBait, useDeleteBait, useUpdateBait } from '../../features/dicts/baits/hooks'
import { useBaitTypes } from '../../features/dicts/baitTypes/hooks'

export default function BaitsPage() {
  const { data } = useBaits()
  const { mutateAsync: createBait, isPending: creating } = useCreateBait()
  const { mutateAsync: updateBait, isPending: updating } = useUpdateBait()
  const { mutateAsync: deleteBait, isPending: deleting } = useDeleteBait()
  const { data: baitTypes } = useBaitTypes()

  const [opened, setOpened] = useState(false)
  const [edit, setEdit] = useState<{ id?: string; brand: string; name: string; type_id?: string | null; color?: string; size?: string }>({ brand: '', name: '', type_id: undefined, color: '', size: '' })

  const rows = (data ?? []).map((b) => (
    <tr key={b.id}>
      <td>{b.brand}</td>
      <td>{b.name}</td>
      <td>{b.color || '—'}</td>
      <td>{b.size || '—'}</td>
      <td>
        <Group gap="xs">
          <Button size="xs" variant="light" onClick={() => { setEdit({ id: b.id, brand: b.brand, name: b.name, type_id: (b as any).type_id || undefined, color: b.color || '', size: b.size || '' }); setOpened(true) }}>Редактировать</Button>
          <Button size="xs" color="red" variant="light" onClick={async () => { await deleteBait(b.id); notifications.show({ color: 'gray', message: 'Удалено' }) }} loading={deleting}>Удалить</Button>
        </Group>
      </td>
    </tr>
  ))

  return (
    <Card withBorder p="lg">
      <Group justify="space-between" mb="md">
        <Title order={3}>Приманки</Title>
        <Button onClick={() => { setEdit({ brand: '', name: '', color: '', size: '' }); setOpened(true) }}>Добавить</Button>
      </Group>
      <Table withTableBorder withColumnBorders striped highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Фирма</Table.Th>
            <Table.Th>Название</Table.Th>
            <Table.Th>Цвет</Table.Th>
            <Table.Th>Размер</Table.Th>
            <Table.Th width={200}></Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>{rows}</Table.Tbody>
      </Table>

      <Modal opened={opened} onClose={() => setOpened(false)} title={edit.id ? 'Редактировать приманку' : 'Добавить приманку'}>
        <Stack>
          <TextInput label="Фирма" value={edit.brand} onChange={(e) => setEdit({ ...edit, brand: e.currentTarget.value })} required />
          <TextInput label="Название" value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.currentTarget.value })} required />
          <Select label="Тип приманки" placeholder="Выберите" data={(baitTypes ?? []).map(t => ({ value: t.id, label: t.name }))} value={edit.type_id ?? undefined} onChange={(v) => setEdit({ ...edit, type_id: v || undefined })} searchable clearable />
          <TextInput label="Цвет" value={edit.color} onChange={(e) => setEdit({ ...edit, color: e.currentTarget.value })} />
          <TextInput label="Размер" value={edit.size} onChange={(e) => setEdit({ ...edit, size: e.currentTarget.value })} />
          <Group justify="flex-end">
            <Button variant="outline" onClick={() => setOpened(false)}>Отмена</Button>
            <Button loading={creating || updating} onClick={async () => {
              const payload = { brand: edit.brand.trim(), name: edit.name.trim(), type_id: edit.type_id || null, color: edit.color?.trim() || undefined, size: edit.size?.trim() || undefined }
              if (!payload.brand || !payload.name) return
              if (edit.id) {
                await updateBait({ id: edit.id, input: payload })
                notifications.show({ color: 'green', message: 'Сохранено' })
              } else {
                await createBait(payload)
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


