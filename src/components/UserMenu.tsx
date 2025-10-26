import { Badge, Text, Stack, Group, Divider, Menu } from '@mantine/core'
import { IconUser, IconLogout, IconSettings, IconUsers, IconUserPlus, IconPlus, IconCrown, IconTrophy } from '@tabler/icons-react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabaseClient'
import { Avatar as AvatarComponent } from './Avatar'

interface UserMenuProps {
  user: any
}

export function UserMenu({ user }: UserMenuProps) {
  const navigate = useNavigate()

  return (
    <Menu shadow="md" width={300}>
      <Menu.Target>
        <Group gap="sm" style={{ cursor: 'pointer' }}>
          <AvatarComponent src={user?.user_metadata?.avatar} size={32} />
          <Stack gap={0} style={{ display: 'flex', alignItems: 'flex-start' }}>
            <Text size="sm" fw={500}>
              {user?.user_metadata?.first_name || user?.user_metadata?.last_name 
                ? `${user?.user_metadata?.first_name || ''} ${user?.user_metadata?.last_name || ''}`.trim()
                : user?.email?.split('@')[0]}
            </Text>
            <Badge variant="light" color="gray" size="xs">
              {user?.user_metadata?.role ?? 'user'}
            </Badge>
          </Stack>
        </Group>
      </Menu.Target>

      <Menu.Dropdown>
        <Menu.Label>
          <Group gap="sm">
            <AvatarComponent src={user?.user_metadata?.avatar} size={50} />
            <Stack gap={0}>
              <Text size="sm" fw={500}>
                {user?.user_metadata?.first_name && user?.user_metadata?.last_name
                  ? `${user.user_metadata.first_name} ${user.user_metadata.last_name}`
                  : user?.email?.split('@')[0]}
              </Text>
              <Text size="xs" c="dimmed">{user?.email}</Text>
            </Stack>
          </Group>
        </Menu.Label>

        <Divider />

        <Menu.Label>Профиль</Menu.Label>
        
        <Menu.Item
          leftSection={<IconSettings size={16} />}
          onClick={() => navigate('/profile/settings')}
        >
          Настройки
        </Menu.Item>

        <Menu.Item
          leftSection={<IconUsers size={16} />}
          onClick={() => navigate('/profile/teams')}
        >
          Мои команды
        </Menu.Item>

        <Menu.Item
          leftSection={<IconUserPlus size={16} />}
          onClick={() => navigate('/profile/invitations')}
        >
          Приглашения
        </Menu.Item>

        <Menu.Item
          leftSection={<IconPlus size={16} />}
          onClick={() => navigate('/profile/trainings')}
        >
          Тренировки
        </Menu.Item>

        <Menu.Item
          leftSection={<IconCrown size={16} />}
          onClick={() => navigate('/profile/baits')}
        >
          Приманки
        </Menu.Item>

        <Menu.Item
          leftSection={<IconTrophy size={16} />}
          onClick={() => navigate('/profile/achievements')}
        >
          Достижения
        </Menu.Item>

        {user?.user_metadata?.role === 'admin' && (
          <>
            <Divider />
            <Menu.Label>Администрирование</Menu.Label>
            <Menu.Item
              leftSection={<IconUser size={16} />}
              onClick={() => navigate('/admin')}
            >
              Административная панель
            </Menu.Item>
          </>
        )}

        <Divider />

        <Menu.Item
          color="red"
          leftSection={<IconLogout size={16} />}
          onClick={() => supabase.auth.signOut()}
        >
          Выйти
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  )
}
