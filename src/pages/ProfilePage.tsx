import { useState } from 'react'
import { 
  Container, 
  Paper, 
  Title, 
  Text, 
  Badge, 
  Group, 
  Stack, 
  Button, 
  NavLink,
  Burger
} from '@mantine/core'
import { useMediaQuery } from '@mantine/hooks'
import { IconPlus, IconUserPlus, IconCrown, IconUsers, IconTrophy, IconDownload, IconSettings } from '@tabler/icons-react'
import { useAuth } from '@/features/auth/hooks'
import { useNavigate, Outlet, useLocation } from 'react-router-dom'
import { useExportUserStats } from '@/features/export/hooks'
import { Avatar } from '@/components/Avatar'
import { 
  useUserAchievementsByCategory,
} from '@/features/achievements/hooks'

export default function ProfilePage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const mobile = useMediaQuery('(max-width: 768px)')
  
  const { total: totalAchievements, points: totalPoints } = useUserAchievementsByCategory(user?.id)
  const exportUserStats = useExportUserStats()

  const [opened, setOpened] = useState(!mobile)

  // Определяем активную вкладку на основе URL
  const activeTab = location.pathname.split('/profile/')[1] || 'settings'

  const handleExportStats = async () => {
    if (!user?.id) return
    await exportUserStats.mutateAsync({
      userId: user.id,
      config: {
        format: 'csv',
        includeHeaders: true
      },
      includeAchievements: true,
      includeRewards: true,
      includeTrainingData: true
    })
  }

  const tabs = [
    { 
      label: 'Настройки', 
      icon: IconSettings, 
      path: 'settings',
      description: 'Личные данные'
    },
    { 
      label: 'Мои команды', 
      icon: IconUsers, 
      path: 'teams',
      description: 'Ваши команды'
    },
    { 
      label: 'Приглашения', 
      icon: IconUserPlus, 
      path: 'invitations',
      description: 'Входящие приглашения'
    },
    { 
      label: 'Тренировки', 
      icon: IconPlus, 
      path: 'trainings',
      description: 'Личные тренировки'
    },
    { 
      label: 'Приманки', 
      icon: IconCrown, 
      path: 'baits',
      description: 'Мои приманки'
    },
    { 
      label: 'Достижения', 
      icon: IconTrophy, 
      path: 'achievements',
      description: 'Ваши достижения'
    },
  ]

  if (!user) {
    return (
      <Container size="lg" py="xl">
        <Text ta="center" c="dimmed">
          Необходимо авторизоваться для просмотра профиля
        </Text>
      </Container>
    )
  }

  return (
    <Stack gap={0} h="100%">
      <Group
        p="md"
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
          <Group gap="md">
            <Burger
              opened={opened}
              onClick={() => setOpened((o) => !o)}
              size="sm"
            />
            <Title order={3}>Профиль</Title>
          </Group>
        )}
      </Group>
      
      <Group align="flex-start" gap={0} style={{ flex: 1, overflow: 'hidden' }}>
        {/* Sidebar */}
        <Paper
          style={{
            width: mobile ? '100%' : 300,
            height: mobile ? 'auto' : 'calc(100vh - 60px)',
            position: mobile ? (opened ? 'fixed' : 'absolute') : 'relative',
            left: mobile ? (opened ? 0 : -300) : 0,
            top: mobile ? '60px' : 0,
            zIndex: 200,
            transition: 'left 0.2s ease',
            overflowY: 'auto',
            borderRight: mobile ? undefined : '1px solid var(--mantine-color-gray-3)',
          }}
          p="md"
          withBorder={mobile}
        >
        <Stack gap="md">
          {/* User Info */}
          <Paper p="md" withBorder>
            <Stack gap="sm" align="center">
              <Avatar src={user.user_metadata?.avatar} size={80} />
              <Stack gap={4} align="center">
                <Text size="sm" fw={500}>
                  {user.user_metadata?.first_name} {user.user_metadata?.last_name}
                </Text>
                <Badge variant="light" color="blue" size="sm">
                  {user.user_metadata?.role || 'user'}
                </Badge>
                <Text size="xs" c="dimmed">
                  {user.email}
                </Text>
                <Group gap="xs">
                  <Badge variant="light" color="green" size="xs">
                    {totalAchievements}
                  </Badge>
                  <Badge variant="light" color="orange" size="xs">
                    {totalPoints}
                  </Badge>
                </Group>
              </Stack>
            </Stack>
          </Paper>

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
                    navigate(`/profile/${tab.path}`)
                    if (mobile) setOpened(false)
                  }}
                />
              )
            })}
          </Stack>

          {/* Export Button */}
          <Button
            fullWidth
            variant="light"
            leftSection={<IconDownload size={16} />}
            onClick={handleExportStats}
            loading={exportUserStats.isPending}
            mt="auto"
          >
            Экспорт данных
          </Button>
        </Stack>
        </Paper>

        {/* Content Area */}
        <Stack
          style={{
            flex: 1,
            minWidth: 0,
            height: mobile ? 'auto' : 'calc(100vh - 60px)',
            overflowY: 'auto',
          }}
          p={mobile ? 'sm' : 'lg'}
        >
          <Outlet />
        </Stack>
      </Group>
    </Stack>
  )
}
