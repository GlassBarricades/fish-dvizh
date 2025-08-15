import { Burger, Container, Group, NavLink, Title, Drawer, Paper, Stack, Box } from '@mantine/core'
import { Link, Outlet, useLocation } from 'react-router-dom'
import { useDisclosure } from '@mantine/hooks'

export default function AdminPage() {
  const location = useLocation()
  const active = (path: string) => location.pathname.includes(path)
  const [mobileOpened, { toggle: toggleMobile, close: closeMobile }] = useDisclosure()
  const [desktopOpened, { toggle: toggleDesktop }] = useDisclosure(true)
  return (
    <Container fluid py="md">
      <Group h={60} px="md" justify="space-between">
        <Group>
          <Burger opened={mobileOpened} onClick={toggleMobile} hiddenFrom="sm" size="sm" />
          <Burger opened={desktopOpened} onClick={toggleDesktop} visibleFrom="sm" size="sm" />
          <Title order={4}>Admin</Title>
        </Group>
      </Group>

      <Group align="flex-start" gap="md" wrap="nowrap">
        {desktopOpened && (
          <Paper withBorder radius="md" p="md" w={260} visibleFrom="sm">
            <Stack gap="xs">
              <NavLink component={Link} to="/admin/users" label="Пользователи" active={active('/admin/users')} />
              <NavLink component={Link} to="/admin/dicts" label="Справочники">
                <NavLink component={Link} to="/admin/dicts/fish" label="Виды рыбы" active={active('/admin/dicts/fish')} />
                <NavLink component={Link} to="/admin/dicts/formats" label="Форматы соревнований" active={active('/admin/dicts/formats')} />
              </NavLink>
            </Stack>
          </Paper>
        )}

        <Box style={{ flex: 1 }}>
          <Outlet />
        </Box>
      </Group>

      <Drawer opened={mobileOpened} onClose={closeMobile} title="Меню" size={280} padding="md" hiddenFrom="sm">
        <Stack gap="xs">
          <NavLink component={Link} to="/admin/users" label="Пользователи" active={active('/admin/users')} onClick={closeMobile} />
          <NavLink component={Link} to="/admin/dicts" label="Справочники">
            <NavLink component={Link} to="/admin/dicts/fish" label="Виды рыбы" active={active('/admin/dicts/fish')} onClick={closeMobile} />
            <NavLink component={Link} to="/admin/dicts/formats" label="Форматы соревнований" active={active('/admin/dicts/formats')} onClick={closeMobile} />
          </NavLink>
        </Stack>
      </Drawer>
    </Container>
  )
}


