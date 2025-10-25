import { AppShell, Group, Burger, Button, ActionIcon, useMantineColorScheme, Text, Badge, Stack, Divider } from '@mantine/core'
import classes from './App.module.css';
import { useDisclosure } from '@mantine/hooks';
import { useAuth } from '@/features/auth/hooks'
import { supabase } from '@/lib/supabaseClient'
import { IconMoon, IconSun } from '@tabler/icons-react'
import { NavLink, Outlet } from 'react-router-dom'

function App() {
  const [opened, { toggle }] = useDisclosure();
  const { user } = useAuth()
  const { colorScheme, setColorScheme } = useMantineColorScheme()
  const dark = colorScheme === 'dark'
  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{ width: 300, breakpoint: 'sm', collapsed: { desktop: true, mobile: !opened } }}
      padding="md"
      styles={{
        root: {
          width: '100%'
        },
      }}
    >
      <AppShell.Header>
        <Group h="100%" px="md">
          <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
          <Group justify="space-between" style={{ flex: 1 }}>
            <Text size="lg" fw={700}>FishDvizh</Text>
            <Group ml="xl" gap={8} visibleFrom="sm">
              <Group gap="xs">
                <NavLink to="/" className={({ isActive }) => isActive ? `${classes.link} ${classes.linkActive}` : classes.link}>
                  Главная
                </NavLink>
                <NavLink to="/leaderboard" className={({ isActive }) => isActive ? `${classes.link} ${classes.linkActive}` : classes.link}>
                  Рейтинг
                </NavLink>
                <NavLink to="/competitions" className={({ isActive }) => isActive ? `${classes.link} ${classes.linkActive}` : classes.link}>
                  Соревнования
                </NavLink>
                <NavLink to="/leagues" className={({ isActive }) => isActive ? `${classes.link} ${classes.linkActive}` : classes.link}>
                  Лиги
                </NavLink>
                <NavLink to="/map" className={({ isActive }) => isActive ? `${classes.link} ${classes.linkActive}` : classes.link}>
                  Карта
                </NavLink>
                <NavLink to="/profile" className={({ isActive }) => isActive ? `${classes.link} ${classes.linkActive}` : classes.link}>
                  Профиль
                </NavLink>
                {user?.user_metadata?.role === 'admin' && (
                  <NavLink to="/admin" className={({ isActive }) => isActive ? `${classes.link} ${classes.linkActive}` : classes.link}>
                    Администрирование
                  </NavLink>
                )}
              </Group>
              {user ? (
                <>
                  <Badge variant="light" color="gray" mr="sm">
                    {(user as any)?.user_metadata?.role ?? 'user'}
                  </Badge>
                  <Text size="sm" c="dimmed" mx="md">{user.email}</Text>
                  <Button variant="light" onClick={() => supabase.auth.signOut()}>Выйти</Button>
                </>
              ) : (
                <Button component="a" href="/auth" variant="light">Войти</Button>
              )}
              <ActionIcon
                variant="default"
                size="lg"
                onClick={() => setColorScheme(dark ? 'light' : 'dark')}
                aria-label="Toggle color scheme"
                ml="md"
              >
                {dark ? <IconSun size={18} /> : <IconMoon size={18} />}
              </ActionIcon>
            </Group>
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar py="md" px={4}>
        <Stack gap="xs">
          <NavLink to="/" onClick={toggle} className={({ isActive }) => isActive ? `${classes.mobileLink} ${classes.linkActive}` : classes.mobileLink}>
            Главная
          </NavLink>
          <NavLink to="/leaderboard" onClick={toggle} className={({ isActive }) => isActive ? `${classes.mobileLink} ${classes.linkActive}` : classes.mobileLink}>
            Рейтинг
          </NavLink>
          <NavLink to="/competitions" onClick={toggle} className={({ isActive }) => isActive ? `${classes.mobileLink} ${classes.linkActive}` : classes.mobileLink}>
            Соревнования
          </NavLink>
          <NavLink to="/leagues" onClick={toggle} className={({ isActive }) => isActive ? `${classes.mobileLink} ${classes.linkActive}` : classes.mobileLink}>
            Лиги
          </NavLink>
          <NavLink to="/map" onClick={toggle} className={({ isActive }) => isActive ? `${classes.mobileLink} ${classes.linkActive}` : classes.mobileLink}>
            Карта
          </NavLink>
          <NavLink to="/profile" onClick={toggle} className={({ isActive }) => isActive ? `${classes.mobileLink} ${classes.linkActive}` : classes.mobileLink}>
            Профиль
          </NavLink>
          {user?.user_metadata?.role === 'admin' && (
            <NavLink to="/admin" onClick={toggle} className={({ isActive }) => isActive ? `${classes.mobileLink} ${classes.linkActive}` : classes.mobileLink}>
              Администрирование
            </NavLink>
          )}
          <Divider my="sm" />
          {user ? (
            <>
              <Text size="sm" c="dimmed" px="md">{user.email}</Text>
              <Button variant="light" mx="md" onClick={() => { toggle(); supabase.auth.signOut() }}>Выйти</Button>
            </>
          ) : (
            <Button variant="light" mx="md" component="a" href="/auth" onClick={toggle}>Войти</Button>
          )}
          <Button variant="default" mx="md" onClick={() => setColorScheme(dark ? 'light' : 'dark')}>
            {dark ? 'Светлая тема' : 'Темная тема'}
          </Button>
        </Stack>
      </AppShell.Navbar>

      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  )
}

export default App
