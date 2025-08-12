import { AppShell, Group, Burger, UnstyledButton, Button, ActionIcon, useMantineColorScheme, Text } from '@mantine/core'
import classes from './App.module.css';
import { useDisclosure } from '@mantine/hooks';
import { useAuth } from './features/auth/hooks'
import { supabase } from './lib/supabaseClient'
import { IconMoon, IconSun } from '@tabler/icons-react'
import { Link, Outlet } from 'react-router-dom'

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
          width: '100vw',
        },
      }}
    >
      <AppShell.Header>
        <Group h="100%" px="md">
          <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
          <Group justify="space-between" style={{ flex: 1 }}>
            <Text size="lg" fw={700}>FishDvizh</Text>
            <Group ml="xl" gap={8} visibleFrom="sm">
              <UnstyledButton className={classes.control} component={Link} to="/">Home</UnstyledButton>
              <UnstyledButton className={classes.control} component={Link} to="/map">Map</UnstyledButton>
              {user ? (
                <>
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
        <UnstyledButton className={classes.control}>Home</UnstyledButton>
        <UnstyledButton className={classes.control}>Blog</UnstyledButton>
        <UnstyledButton className={classes.control}>Contacts</UnstyledButton>
        <UnstyledButton className={classes.control}>Support</UnstyledButton>
      </AppShell.Navbar>

      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  )
}

export default App
