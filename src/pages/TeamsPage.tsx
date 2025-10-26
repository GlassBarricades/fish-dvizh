import { useState } from 'react'
import { Container, Paper, Stack, Title, Text, TextInput, Button, Table, Badge, Loader, Group, Card } from '@mantine/core'
import { useNavigate } from 'react-router-dom'
import { useTeams } from '@/features/teams/hooks'
import { IconSearch, IconUsers } from '@tabler/icons-react'

export default function TeamsPage() {
  const navigate = useNavigate()
  const { data: teams, isLoading } = useTeams()
  const [searchQuery, setSearchQuery] = useState('')

  // Фильтрация команд по поисковому запросу
  const filteredTeams = (teams || []).filter(team => {
    if (!searchQuery.trim()) return true
    
    const query = searchQuery.toLowerCase()
    const name = (team.name || '').toLowerCase()
    const description = (team.description || '').toLowerCase()
    
    return name.includes(query) || description.includes(query)
  })

  const handleTeamClick = (teamId: string) => {
    navigate(`/team/${teamId}`)
  }

  if (isLoading) {
    return (
      <Container size="lg" py="xl">
        <Paper p="xl" withBorder>
          <Stack align="center" gap="md">
            <Loader size="lg" />
            <Text c="dimmed">Загрузка команд...</Text>
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
            <Group justify="space-between">
              <div>
                <Title order={2}>Команды</Title>
                <Text c="dimmed">Список всех команд</Text>
              </div>
              <Button
                leftSection={<IconUsers size={16} />}
                onClick={() => navigate('/profile/teams')}
              >
                Мои команды
              </Button>
            </Group>
            
            <TextInput
              placeholder="Поиск по названию или описанию..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.currentTarget.value)}
              leftSection={<IconSearch size={16} />}
              size="md"
            />

            {filteredTeams.length === 0 ? (
              <Paper p="lg" withBorder style={{ backgroundColor: 'var(--mantine-color-gray-0)' }}>
                <Text c="dimmed" ta="center">
                  {searchQuery ? 'Команды не найдены' : 'Нет команд'}
                </Text>
              </Paper>
            ) : (
              <>
                <Table.ScrollContainer minWidth={800}>
                  <Table striped highlightOnHover>
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th>Название</Table.Th>
                        <Table.Th>Описание</Table.Th>
                        <Table.Th>Дата создания</Table.Th>
                        <Table.Th>Действия</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {filteredTeams.map((team) => (
                        <Table.Tr key={team.id}>
                          <Table.Td>
                            <Text fw={500}>{team.name}</Text>
                          </Table.Td>
                          <Table.Td>
                            <Text size="sm" c="dimmed" lineClamp={2}>
                              {team.description || '-'}
                            </Text>
                          </Table.Td>
                          <Table.Td>
                            <Text size="sm" c="dimmed">
                              {new Date(team.created_at).toLocaleDateString('ru-RU')}
                            </Text>
                          </Table.Td>
                          <Table.Td>
                            <Button
                              size="xs"
                              variant="light"
                              onClick={() => handleTeamClick(team.id)}
                            >
                              Открыть
                            </Button>
                          </Table.Td>
                        </Table.Tr>
                      ))}
                    </Table.Tbody>
                  </Table>
                </Table.ScrollContainer>

                <Text size="sm" c="dimmed" ta="center">
                  Найдено команд: {filteredTeams.length}
                </Text>
              </>
            )}
          </Stack>
        </Paper>
      </Stack>
    </Container>
  )
}
