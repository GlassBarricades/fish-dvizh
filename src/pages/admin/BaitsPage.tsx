import { useState } from 'react'
import { ActionIcon, Button, Card, Group, Modal, Stack, Table, TextInput, Title, Select } from '@mantine/core'
import { IconPencil, IconTrash } from '@tabler/icons-react'
import { notifications } from '@mantine/notifications'
import { useBaits, useCreateBait, useDeleteBait, useUpdateBait } from '../../features/dicts/baits/hooks'
import { useBaitTypes } from '../../features/dicts/baitTypes/hooks'
import { useBaitManufacturers } from '../../features/dicts/baitManufacturers/hooks'

export default function BaitsPage() {
  const { data } = useBaits()
  const { mutateAsync: createBait, isPending: creating } = useCreateBait()
  const { mutateAsync: updateBait, isPending: updating } = useUpdateBait()
  const { mutateAsync: deleteBait, isPending: deleting } = useDeleteBait()
  const { data: baitTypes } = useBaitTypes()
  const { data: manufacturers } = useBaitManufacturers()

  const [opened, setOpened] = useState(false)
  const [edit, setEdit] = useState<{ id?: string; name: string; type_id?: string | null; color?: string; size?: string; manufacturer_id?: string | null }>({ name: '', type_id: undefined, color: '', size: '', manufacturer_id: undefined })

  const rows = (data ?? []).map((b) => (
    <tr key={b.id}>
      <td>{manufacturers?.find(m => m.id === (b as any).manufacturer_id)?.name || b.brand || '—'}</td>
      <td>{(baitTypes ?? []).find(t => t.id === (b as any).type_id)?.name || '—'}</td>
      <td>{b.name}</td>
      <td>{b.color || '—'}</td>
      <td>{b.size || '—'}</td>
      <td style={{ width: 120 }}>
        <Group gap="xs" justify="flex-end">
          <ActionIcon variant="subtle" onClick={() => { setEdit({ id: b.id, name: b.name, type_id: (b as any).type_id || undefined, color: b.color || '', size: b.size || '', manufacturer_id: (b as any).manufacturer_id || undefined }); setOpened(true) }}>
            <IconPencil size={16} />
          </ActionIcon>
          <ActionIcon variant="subtle" color="red" onClick={async () => { await deleteBait(b.id); notifications.show({ color: 'gray', message: 'Удалено' }) }} loading={deleting}>
            <IconTrash size={16} />
          </ActionIcon>
        </Group>
      </td>
    </tr>
  ))

  return (
    <Card withBorder p="lg">
      <Group justify="space-between" mb="md">
        <Title order={3}>Приманки</Title>
        <Button onClick={() => { setEdit({ name: '', color: '', size: '', manufacturer_id: undefined }); setOpened(true) }}>Добавить</Button>
      </Group>
      <Table withTableBorder withColumnBorders striped highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Производитель</Table.Th>
            <Table.Th>Тип</Table.Th>
            <Table.Th>Название</Table.Th>
            <Table.Th>Цвет</Table.Th>
            <Table.Th>Размер</Table.Th>
            <Table.Th style={{ width: 200 }}></Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>{rows}</Table.Tbody>
      </Table>

      <Modal opened={opened} onClose={() => setOpened(false)} title={edit.id ? 'Редактировать приманку' : 'Добавить приманку'}>
        <Stack>
          <Select label="Производитель" placeholder="Выберите" data={(manufacturers ?? []).map(m => ({ value: m.id, label: m.name }))} value={edit.manufacturer_id ?? undefined} onChange={(v) => setEdit({ ...edit, manufacturer_id: v || undefined })} searchable clearable required />
          <TextInput label="Название" value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.currentTarget.value })} required />
          <Select label="Тип приманки" placeholder="Выберите" data={(baitTypes ?? []).map(t => ({ value: t.id, label: t.name }))} value={edit.type_id ?? undefined} onChange={(v) => setEdit({ ...edit, type_id: v || undefined })} searchable clearable />
          <TextInput label="Цвет" value={edit.color} onChange={(e) => setEdit({ ...edit, color: e.currentTarget.value })} />
          <TextInput label="Размер" value={edit.size} onChange={(e) => setEdit({ ...edit, size: e.currentTarget.value })} />
          <Group justify="flex-end">
            <Button variant="outline" onClick={() => setOpened(false)}>Отмена</Button>
            <Button loading={creating || updating} onClick={async () => {
              const manufacturerName = (manufacturers ?? []).find(m => m.id === (edit.manufacturer_id || ''))?.name || ''
              const payload = { brand: manufacturerName, name: edit.name.trim(), type_id: edit.type_id || null, manufacturer_id: edit.manufacturer_id || null, color: edit.color?.trim() || undefined, size: edit.size?.trim() || undefined }
              if (!payload.brand || !payload.name || !edit.manufacturer_id) return
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


