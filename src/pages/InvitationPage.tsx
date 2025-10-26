// Страница принятия приглашения в лигу
// Создайте файл src/pages/InvitationPage.tsx

import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Container,
  Paper,
  Stack,
  Title,
  Text,
  Button,
  Group,
  Badge,
  Alert,
  Loader,
  Center,
  Card,
  Avatar
} from '@mantine/core'
import {
  IconCheck,
  IconX,
  IconClock,
  IconAlertCircle,
  IconTrophy
} from '@tabler/icons-react'
import { useAuth } from '@/features/auth/hooks'
import { useInvitationByToken, useAcceptLeagueInvitation, useDeclineLeagueInvitation } from '@/features/leagues/model/hooks'
import { useLeague } from '@/features/leagues/hooks'
import dayjs from 'dayjs'

export default function InvitationPage() {
  const { token } = useParams<{ token: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  
  const { data: invitation, isLoading: invitationLoading, error: invitationError } = useInvitationByToken(token)
  const { data: league } = useLeague(invitation?.league_id)
  
  const acceptInvitation = useAcceptLeagueInvitation()
  const declineInvitation = useDeclineLeagueInvitation()
  
  const [isProcessing, setIsProcessing] = useState(false)

  const handleAcceptInvitation = async () => {
    if (!user?.id || !token) return
    
    setIsProcessing(true)
    try {
      await acceptInvitation.mutateAsync({
        token,
        user_id: user.id
      })
      
      // Перенаправляем на страницу лиги
      navigate(`/league/${invitation?.league_id}`)
    } catch (error) {
      // Ошибка обрабатывается в хуке
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDeclineInvitation = async () => {
    if (!token) return
    
    setIsProcessing(true)
    try {
      await declineInvitation.mutateAsync(token)
      
      // Перенаправляем на главную страницу
      navigate('/')
    } catch (error) {
      // Ошибка обрабатывается в хуке
    } finally {
      setIsProcessing(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'yellow'
      case 'accepted': return 'green'
      case 'declined': return 'red'
      case 'expired': return 'gray'
      default: return 'gray'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <IconClock size={16} />
      case 'accepted': return <IconCheck size={16} />
      case 'declined': return <IconX size={16} />
      case 'expired': return <IconAlertCircle size={16} />
      default: return null
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Ожидает ответа'
      case 'accepted': return 'Принято'
      case 'declined': return 'Отклонено'
      case 'expired': return 'Истекло'
      default: return 'Неизвестно'
    }
  }

  if (invitationLoading) {
    return (
      <Container size="sm" py="xl">
        <Center>
          <Stack align="center" gap="md">
            <Loader size="lg" />
            <Text c="dimmed">Загрузка приглашения...</Text>
          </Stack>
        </Center>
      </Container>
    )
  }

  if (invitationError || !invitation) {
    return (
      <Container size="sm" py="xl">
        <Alert
          icon={<IconAlertCircle size={16} />}
          title="Приглашение не найдено"
          color="red"
        >
          <Text mb="md">
            Приглашение не найдено или ссылка недействительна.
          </Text>
          <Button onClick={() => navigate('/')}>
            Вернуться на главную
          </Button>
        </Alert>
      </Container>
    )
  }

  const isExpired = new Date(invitation.expires_at) < new Date()
  const canRespond = invitation.status === 'pending' && !isExpired && user?.id

  return (
    <Container size="sm" py="xl">
      <Paper withBorder p="xl" radius="lg">
        <Stack gap="lg">
          {/* Заголовок */}
          <Stack align="center" gap="sm">
            <Avatar size={80} radius="xl" color="blue">
              <IconTrophy size={40} />
            </Avatar>
            <Title order={2} ta="center">
              Приглашение в лигу
            </Title>
            <Text c="dimmed" ta="center">
              Вас пригласили присоединиться к лиге
            </Text>
          </Stack>

          {/* Информация о лиге */}
          {league && (
            <Card withBorder p="md" radius="md">
              <Stack gap="sm">
                <Group justify="space-between">
                  <Text fw={500}>Лига:</Text>
                  <Text>{league.name}</Text>
                </Group>
                
                {league.description && (
                  <Group justify="space-between" align="flex-start">
                    <Text fw={500}>Описание:</Text>
                    <Text size="sm" c="dimmed" style={{ maxWidth: '60%' }}>
                      {league.description}
                    </Text>
                  </Group>
                )}
                
                <Group justify="space-between">
                  <Text fw={500}>Сезон:</Text>
                  <Text>{league.season}</Text>
                </Group>
                
                <Group justify="space-between">
                  <Text fw={500}>Статус:</Text>
                  <Badge
                    color={league.status === 'active' ? 'green' : league.status === 'upcoming' ? 'blue' : 'gray'}
                    variant="light"
                  >
                    {league.status === 'active' && 'Активная'}
                    {league.status === 'upcoming' && 'Предстоящая'}
                    {league.status === 'finished' && 'Завершенная'}
                  </Badge>
                </Group>
                
                <Group justify="space-between">
                  <Text fw={500}>Начало:</Text>
                  <Text size="sm">
                    {dayjs(league.start_date).format('DD.MM.YYYY')}
                  </Text>
                </Group>
                
                <Group justify="space-between">
                  <Text fw={500}>Окончание:</Text>
                  <Text size="sm">
                    {dayjs(league.end_date).format('DD.MM.YYYY')}
                  </Text>
                </Group>
              </Stack>
            </Card>
          )}

          {/* Информация о приглашении */}
          <Card withBorder p="md" radius="md">
            <Stack gap="sm">
              <Group justify="space-between">
                <Text fw={500}>Email:</Text>
                <Text>{invitation.email}</Text>
              </Group>
              
              <Group justify="space-between">
                <Text fw={500}>Статус:</Text>
                <Badge
                  color={getStatusColor(invitation.status)}
                  leftSection={getStatusIcon(invitation.status)}
                >
                  {getStatusText(invitation.status)}
                </Badge>
              </Group>
              
              <Group justify="space-between">
                <Text fw={500}>Отправлено:</Text>
                <Text size="sm">
                  {dayjs(invitation.created_at).format('DD.MM.YYYY HH:mm')}
                </Text>
              </Group>
              
              <Group justify="space-between">
                <Text fw={500}>Истекает:</Text>
                <Text size="sm" c={isExpired ? 'red' : 'dimmed'}>
                  {dayjs(invitation.expires_at).format('DD.MM.YYYY HH:mm')}
                </Text>
              </Group>
            </Stack>
          </Card>

          {/* Предупреждения */}
          {isExpired && (
            <Alert
              icon={<IconAlertCircle size={16} />}
              title="Приглашение истекло"
              color="red"
            >
              Срок действия приглашения истек. Обратитесь к организатору лиги для получения нового приглашения.
            </Alert>
          )}

          {!user && (
            <Alert
              icon={<IconAlertCircle size={16} />}
              title="Требуется авторизация"
              color="blue"
            >
              Для принятия приглашения необходимо войти в систему.
            </Alert>
          )}

          {user && invitation.email !== user.email && (
            <Alert
              icon={<IconAlertCircle size={16} />}
              title="Неверный email"
              color="orange"
            >
              Приглашение отправлено на другой email адрес. Убедитесь, что вы используете правильный аккаунт.
            </Alert>
          )}

          {/* Кнопки действий */}
          {canRespond && (
            <Group justify="center" gap="md">
              <Button
                color="green"
                leftSection={<IconCheck size={16} />}
                onClick={handleAcceptInvitation}
                loading={isProcessing}
                size="lg"
              >
                Принять приглашение
              </Button>
              
              <Button
                variant="light"
                color="red"
                leftSection={<IconX size={16} />}
                onClick={handleDeclineInvitation}
                loading={isProcessing}
                size="lg"
              >
                Отклонить
              </Button>
            </Group>
          )}

          {invitation.status === 'accepted' && (
            <Alert
              icon={<IconCheck size={16} />}
              title="Приглашение принято"
              color="green"
            >
              Вы уже приняли это приглашение и являетесь участником лиги.
            </Alert>
          )}

          {invitation.status === 'declined' && (
            <Alert
              icon={<IconX size={16} />}
              title="Приглашение отклонено"
              color="red"
            >
              Вы отклонили это приглашение.
            </Alert>
          )}

          {/* Кнопка возврата */}
          <Group justify="center">
            <Button variant="light" onClick={() => navigate('/')}>
              Вернуться на главную
            </Button>
          </Group>
        </Stack>
      </Paper>
    </Container>
  )
}
