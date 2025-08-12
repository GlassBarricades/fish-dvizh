import { Container, Paper, Stack, Title, Text, Button } from '@mantine/core'
import { useLocation, Link } from 'react-router-dom'

export default function CheckEmailPage() {
  const location = useLocation() as any
  const email = location.state?.email as string | undefined
  return (
    <Container size="xs" py="xl" style={{ minHeight: '100svh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Paper p="lg" withBorder radius="md" w="100%">
        <Stack>
          <Title order={3}>Подтвердите e-mail</Title>
          <Text>
            Мы отправили письмо{email ? ` на ${email}` : ''}. Перейдите по ссылке в письме, затем вернитесь и войдите.
          </Text>
          <Button component={Link} to="/auth" variant="light">Вернуться к входу</Button>
        </Stack>
      </Paper>
    </Container>
  )
}


