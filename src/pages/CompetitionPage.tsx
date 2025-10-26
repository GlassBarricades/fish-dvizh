import { useEffect } from 'react'
import { useParams, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/features/auth/hooks'
import { Stack, Paper, Badge, Group, Burger, Title, Text, NavLink, Box } from '@mantine/core'
import { useMediaQuery, useDisclosure } from '@mantine/hooks'
import { useCompetition } from '@/features/competitions/hooks'
import { useCompetitionLeagues } from '@/features/leagues/hooks'
import { useTeamSizes } from '@/features/dicts/teamSizes/hooks'
import { IconUsers, IconTrophy, IconGavel, IconCalendar, IconMapPin, IconInfoCircle } from '@tabler/icons-react'

export default function CompetitionPage() {
  const { competitionId } = useParams()
  const { user, role } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const mobile = useMediaQuery('(max-width: 768px)')
  
  const { data: competition } = useCompetition(competitionId!)
  const { data: teamSizes } = useTeamSizes()
  const { data: competitionLeagues } = useCompetitionLeagues(competitionId!)
  
  const [opened, { toggle, close }] = useDisclosure(!mobile)

  if (!competitionId) return <Text>Нет соревнования</Text>

  // Определяем активную вкладку из URL
  const activeTab = location.pathname.split('/competition/')[1]?.split('/')[1] || 'overview'
  
  // Проверка прав на редактирование - только админы и создатели
  const canEdit = !!(
    user?.id && (
      role === 'admin' || 
      user.id === competition?.created_by
    )
  )

  const tabs = [
    {
      label: 'Обзор',
      icon: IconInfoCircle,
      path: 'overview',
      description: 'Информация о соревновании'
    },
    {
      label: teamSizes?.find(s => s.id === competition?.team_size_id)?.size === 1 ? 'Участники' : 'Команды',
      icon: IconUsers,
      path: 'teams',
      description: 'Участники соревнования'
    },
    {
      label: 'Результаты',
      icon: IconTrophy,
      path: 'results',
      description: 'Результаты соревнования'
    },
  ]

  // Добавляем вкладки для редактирования только если есть права
  if (canEdit) {
    tabs.push(
      {
        label: 'Судьи',
        icon: IconGavel,
        path: 'judges',
        description: 'Управление судьями'
      },
      {
        label: 'Расписание',
        icon: IconCalendar,
        path: 'schedule',
        description: 'Расписание туров'
      },
      {
        label: 'Зоны',
        icon: IconMapPin,
        path: 'zones',
        description: 'Управление зонами'
      }
    )
  }

  useEffect(() => {
    // Перенаправляем на overview при первом заходе
    if (location.pathname === `/competition/${competitionId}`) {
      navigate(`/competition/${competitionId}/overview`, { replace: true })
    }
  }, [location.pathname, competitionId, navigate])

  return (
    <Stack gap={0} h="100%">
      {/* Header */}
      <Group
        p={mobile ? 'sm' : 'md'}
        style={{
          width: '100%',
          position: 'sticky',
          top: 0,
          zIndex: 100,
          backgroundColor: 'var(--mantine-color-body)',
          borderBottom: '1px solid var(--mantine-color-gray-3)',
        }}
      >
        {mobile && (
          <Burger
            opened={opened}
            onClick={toggle}
            size="sm"
          />
        )}
        <Stack gap={4} style={{ flex: 1, minWidth: 0 }}>
          <Title order={mobile ? 4 : 3} style={{ wordBreak: 'break-word' }}>
            {competition?.title ?? 'Соревнование'}
          </Title>
          {competition?.starts_at && (
            <Text size="xs" c="dimmed">
              {new Date(competition.starts_at).toLocaleDateString('ru-RU')}
            </Text>
          )}
        </Stack>
        {!mobile && competitionLeagues && competitionLeagues.length > 0 && (
          <Group gap="xs">
            {competitionLeagues.map((league) => (
              <Badge key={league.id} variant="light" color="blue" size="sm">
                {league.name}
              </Badge>
            ))}
          </Group>
        )}
      </Group>

      {/* Mobile overlay */}
      {mobile && opened && (
        <Box
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
            zIndex: 199,
          }}
          onClick={close}
        />
      )}

      <Box style={{ display: 'flex', flex: 1, overflow: 'hidden', position: 'relative' }}>
        {/* Sidebar */}
        <Paper
          style={{
            width: mobile ? 280 : 300,
            height: mobile ? '100vh' : 'calc(100vh - 80px)',
            position: mobile ? 'fixed' : 'relative',
            left: mobile ? (opened ? 0 : -280) : 0,
            top: mobile ? 0 : undefined,
            zIndex: 200,
            transition: 'left 0.3s ease',
            overflowY: 'auto',
            borderRight: mobile ? undefined : '1px solid var(--mantine-color-gray-3)',
          }}
          p={mobile ? 'sm' : 'md'}
          withBorder={mobile}
          shadow={mobile ? 'xl' : undefined}
        >
          <Stack gap={mobile ? 'sm' : 'md'}>
            {/* Competition Info */}
            {competition && !mobile && (
              <Paper p="md" withBorder>
                <Stack gap="xs">
                  {competition.description && (
                    <Text size="sm" c="dimmed">
                      {competition.description}
                    </Text>
                  )}
                  {competition.lat && competition.lng && (
                    <Text size="xs" c="dimmed">
                      📍 {competition.lat.toFixed(6)}, {competition.lng.toFixed(6)}
                    </Text>
                  )}
                </Stack>
              </Paper>
            )}

            {/* Navigation */}
            <Stack gap={4}>
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <NavLink
                    key={tab.path}
                    label={tab.label}
                    description={mobile ? undefined : tab.description}
                    leftSection={<Icon size={20} />}
                    active={activeTab === tab.path}
                    onClick={() => {
                      navigate(`/competition/${competitionId}/${tab.path}`)
                      if (mobile) close()
                    }}
                  />
                )
              })}
            </Stack>
          </Stack>
        </Paper>

        {/* Content Area */}
        <Stack
          style={{
            flex: 1,
            minWidth: 0,
            height: mobile ? 'auto' : 'calc(100vh - 80px)',
            overflowY: 'auto',
          }}
          p={mobile ? 'xs' : 'lg'}
        >
          <Outlet />
        </Stack>
      </Box>
    </Stack>
  )
}


