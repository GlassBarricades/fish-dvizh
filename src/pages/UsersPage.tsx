import { useState } from 'react'
import { Container, Paper, Stack, Title, Text, TextInput, Group, Button, Table, Badge, Loader } from '@mantine/core'
import { useNavigate } from 'react-router-dom'
import { useAdminUsers } from '@/features/admin/hooks'
import { Avatar } from '@/components/Avatar'
import { IconSearch } from '@tabler/icons-react'

export default function UsersPage() {
  const navigate = useNavigate()
  const { data: users, isLoading } = useAdminUsers()
  const [searchQuery, setSearchQuery] = useState('')

  // Фильтрация пользователей по поисковому запросу
  const filteredUsers = (users || []).filter(user => {
    if (!searchQuery.trim()) return true
    
    const query = searchQuery.toLowerCase()
    const fullName = `${user.first_name || ''} ${user.last_name || ''}`.toLowerCase()
    const email = (user.email || '').toLowerCase()
    
    return fullName.includes(query) || email.includes(query)
  })

  const handleUserClick = (userId: string) => {
    navigate(`/user/${userId}`)
  }

  if (isLoading) {
    return (
      <Container size="lg" py="xl">
        <Paper p="xl" withBorder>
          <Stack align="center" gap="md">
            <Loader size="lg" />
            <Text c="dimmed">Загрузка пользователей...</Text>
          </Stack>
        </Paper>
      </Container>
    )
  }

  return (
    <Container size="lg" py="xl">
      <Stack gap="md">
        <Paper p="xl" withBorder>
          <Stack gap="md">
            <Title order={2}>Пользователи</Title>
            <Text c="dimmed">Список всех зарегистрированных пользователей</Text>
            
            <TextInput
              placeholder="Поиск по имени или email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.currentTarget.value)}
              leftSection={<IconSearch size={16} />}
              size="md"
            />

            {filteredUsers.length === 0 ? (
              <Paper p="lg" withBorder style={{ backgroundColor: 'var(--mantine-color-gray-0)' }}>
                <Text c="dimmed" ta="center">
                  {searchQuery ? 'Пользователи не найдены' : 'Нет пользователей'}
                </Text>
              </Paper>
            ) : (
              <Table.ScrollContainer minWidth={800}>
                <Table striped highlightOnHover>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Аватар</Table.Th>
                      <Table.Th>Имя</Table.Th>
                      <Table.Th>Email</Table.Th>
                      <Table.Th>Роль</Table.Th>
                      <Table.Th>Дата регистрации</Table.Th>
                      <Table.Th>Действия</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {filteredUsers.map((user) => (
                      <Table.Tr key={user.id}>
                        <Table.Td>
                          <Avatar src={user.avatar} size={40} />
                        </Table.Td>
                        <Table.Td>
                          <Text fw={500}>
                            {user.first_name || user.last_name
                              ? `${user.first_name || ''} ${user.last_name || ''}`.trim()
                              : '-'}
                          </Text>
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm">{user.email || '-'}</Text>
                        </Table.Td>
                        <Table.Td>
                          <Badge variant="light" color="blue" size="sm">
                            {user.role || 'user'}
                          </Badge>
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm" c="dimmed">
                            {new Date(user.created_at).toLocaleDateString('ru-RU')}
                          </Text>
                        </Table.Td>
                        <Table.Td>
                          <Button
                            size="xs"
                            variant="light"
                            onClick={() => handleUserClick(user.id)}
                          >
                            Открыть профиль
                          </Button>
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </Table.ScrollContainer>
            )}

            {filteredUsers.length > 0 && (
              <Text size="sm" c="dimmed" ta="center">
                Найдено пользователей: {filteredUsers.length}
              </Text>
            )}
          </Stack>
        </Paper>
      </Stack>
    </Container>
  )
}
