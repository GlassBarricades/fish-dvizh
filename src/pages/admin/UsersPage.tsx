import { Badge, Card, Group, Loader, Select, Table, Text, Title } from '@mantine/core'
import { useAdminUsers, useUpdateUserRole } from '@/features/admin/hooks'
import type { Role } from '@/features/auth/roles'
import { notifications } from '@mantine/notifications'
import { Avatar } from '@/components/Avatar'

export default function AdminUsersPage() {
  const { data, isLoading, isError, error } = useAdminUsers()
  const { mutateAsync, isPending } = useUpdateUserRole()

  async function handleChangeRole(userId: string, role: Role) {
    try {
      await mutateAsync({ userId, role })
      notifications.show({ color: 'green', message: 'Роль обновлена' })
    } catch (e: any) {
      notifications.show({ color: 'red', message: e?.message ?? 'Не удалось обновить роль' })
    }
  }
  return (
    <Card withBorder padding="lg" radius="md">
      <Group justify="space-between" mb="md">
        <Title order={3}>Пользователи</Title>
      </Group>
      {isLoading && <Loader />}
      {isError && <Text c="red">{(error as any)?.message ?? 'Ошибка загрузки'}</Text>}
      {!isLoading && !isError && (
        <Table striped highlightOnHover withTableBorder withColumnBorders>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Аватар</Table.Th>
              <Table.Th>Email</Table.Th>
              <Table.Th>Имя</Table.Th>
              <Table.Th>Фамилия</Table.Th>
              <Table.Th>Дата рождения</Table.Th>
              <Table.Th>Роль</Table.Th>
              <Table.Th>Телефон</Table.Th>
              <Table.Th>Создан</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {data?.map((u) => (
              <Table.Tr key={u.id}>
                <Table.Td>
                  <Avatar src={u.avatar} size={40} />
                </Table.Td>
                <Table.Td>{u.email}</Table.Td>
                <Table.Td>{u.first_name ?? '-'}</Table.Td>
                <Table.Td>{u.last_name ?? '-'}</Table.Td>
                <Table.Td>{u.birth_date ? new Date(u.birth_date).toLocaleDateString('ru-RU') : '-'}</Table.Td>
                <Table.Td>
                  <Group gap="xs">
                    <Badge variant="light">{u.role ?? 'user'}</Badge>
                    <Select
                      size="xs"
                      data={[
                        { value: 'user', label: 'user' },
                        { value: 'organizer', label: 'organizer' },
                        { value: 'admin', label: 'admin' },
                      ]}
                      value={(u.role ?? 'user') as Role}
                      onChange={(v) => v && handleChangeRole(u.id, v as Role)}
                      disabled={isPending}
                      maw={140}
                    />
                  </Group>
                </Table.Td>
                <Table.Td>{u.phone ?? '-'}</Table.Td>
                <Table.Td>{new Date(u.created_at).toLocaleString()}</Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      )}
    </Card>
  )
}


