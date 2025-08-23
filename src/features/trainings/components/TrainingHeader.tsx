import { Group, Stack, Title, Badge, Text, Button, useMantineTheme, Box, ActionIcon } from '@mantine/core'
import { Link, useNavigate } from 'react-router-dom'
import { useCallback, useMemo } from 'react'
import { memo } from 'react'
import { useMediaQuery } from '@mantine/hooks'
import { IconArrowLeft } from '@tabler/icons-react'
import { CurrentRigIndicator } from './CurrentRigIndicator'
import { CurrentTargetFishSelector } from './CurrentTargetFishSelector'
import type { Training } from '../types'
import type { TrainingTakenUserBait } from '../api'
import styles from './TrainingHeader.module.css'

interface TrainingHeaderProps {
  training: Training
  countdownText: string | null
  countdownKind: 'starts' | 'ends' | 'next' | null
  notifEnabled: boolean
  onToggleNotifications: () => Promise<void>
  onQuickPin: (kind: 'strike' | 'lost' | 'snag') => void
  currentRig?: {
    bait: TrainingTakenUserBait | null
    weight: number
  } | null
}

// Мемоизированные обработчики для кнопок быстрых действий
const QuickPinButton = memo(({ 
  kind, 
  onQuickPin, 
  color = 'light',
  isMobile = false
}: { 
  kind: 'strike' | 'lost' | 'snag'
  onQuickPin: (kind: 'strike' | 'lost' | 'snag') => void
  color?: string
  isMobile?: boolean
}) => {
  const handleClick = useCallback(() => onQuickPin(kind), [kind, onQuickPin])
  
  const label = useMemo(() => {
    switch (kind) {
      case 'strike': return isMobile ? '🎣' : 'Поклёвка'
      case 'lost': return isMobile ? '💨' : 'Сход'
      case 'snag': return isMobile ? '🌿' : 'Зацеп'
      default: return ''
    }
  }, [kind, isMobile])
  
  return (
    <Button 
      variant="light" 
      color={color} 
      onClick={handleClick}
      size={isMobile ? 'xs' : 'sm'}
      style={{ 
        minWidth: isMobile ? 44 : 'auto',
        height: isMobile ? 44 : 'auto',
        padding: isMobile ? '8px' : undefined
      }}
    >
      {label}
    </Button>
  )
})

QuickPinButton.displayName = 'QuickPinButton'

// Мемоизированный компонент для отображения времени
const TimeDisplay = memo(({ 
  label, 
  date,
  isMobile = false
}: { 
  label: string
  date: string 
  isMobile?: boolean
}) => {
  const formattedDate = useMemo(() => {
    if (isMobile) {
      return new Date(date).toLocaleDateString('ru-RU', { 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    }
    return new Date(date).toLocaleString('ru-RU')
  }, [date, isMobile])
  
  return (
    <Text size={isMobile ? 'xs' : 'sm'} c="dimmed">
      {isMobile ? `${label}: ${formattedDate}` : `${label}: ${formattedDate}`}
    </Text>
  )
})

TimeDisplay.displayName = 'TimeDisplay'

// Мемоизированный компонент для отображения типа тренировки
const TrainingTypeBadge = memo(({ type, isMobile = false }: { type: string; isMobile?: boolean }) => {
  const label = useMemo(() => 
    type === 'team' ? 'Командная' : 'Личная', [type]
  )
  
  return (
    <Badge variant="light" size={isMobile ? 'xs' : 'sm'}>
      {label}
    </Badge>
  )
})

TrainingTypeBadge.displayName = 'TrainingTypeBadge'

// Мемоизированный компонент для отображения countdown
const CountdownBadge = memo(({ 
  countdownText, 
  countdownKind,
  isMobile = false
}: { 
  countdownText: string
  countdownKind: 'starts' | 'ends' | 'next'
  isMobile?: boolean
}) => {
  const { color, prefix, icon } = useMemo(() => {
    switch (countdownKind) {
      case 'ends': return { color: 'green', prefix: 'Осталось ', icon: '⏰' }
      case 'starts': return { color: 'yellow', prefix: 'Старт через ', icon: '🚀' }
      case 'next': return { color: 'blue', prefix: 'След. задача через ', icon: '📋' }
      default: return { color: 'blue', prefix: '', icon: '⏱️' }
    }
  }, [countdownKind])
  
  return (
    <Badge variant="outline" color={color} size={isMobile ? 'xs' : 'sm'}>
      {isMobile ? `${icon} ${countdownText}` : `${prefix}${countdownText}`}
    </Badge>
  )
})

CountdownBadge.displayName = 'CountdownBadge'

// Кнопка "Назад" с интеллектуальной логикой
const BackButton = memo(({ training, isMobile = false }: { training: Training; isMobile?: boolean }) => {
  const navigate = useNavigate()
  
  // Определяем, куда возвращаться
  const backUrl = useMemo(() => {
    if (training.type === 'team' && training.team_id) {
      return `/team/${training.team_id}`
    }
    return '/profile'
  }, [training.type, training.team_id])
  
  // Определяем текст кнопки
  const buttonText = useMemo(() => {
    if (training.type === 'team' && training.team_id) {
      return isMobile ? '← Команда' : '← К команде'
    }
    return isMobile ? '← Профиль' : '← К профилю'
  }, [training.type, training.team_id, isMobile])
  
  const handleBack = useCallback(() => {
    navigate(backUrl)
  }, [navigate, backUrl])
  
  if (isMobile) {
    return (
      <ActionIcon
        variant="light"
        size="lg"
        onClick={handleBack}
        className={`${styles.mobileBackButton} ${styles.touchFriendly}`}
        aria-label={buttonText}
      >
        <IconArrowLeft size={20} />
      </ActionIcon>
    )
  }
  
  return (
    <Button
      variant="light"
      leftSection={<IconArrowLeft size={16} />}
      onClick={handleBack}
      size="sm"
      className={styles.desktopBackButton}
    >
      {buttonText}
    </Button>
  )
})

BackButton.displayName = 'BackButton'

// Мобильная навигация
const MobileNavigation = memo(({ 
  waterPageUrl, 
  onToggleNotifications, 
  notifEnabled,
  onQuickPin 
}: { 
  waterPageUrl: string
  onToggleNotifications: () => Promise<void>
  notifEnabled: boolean
  onQuickPin: (kind: 'strike' | 'lost' | 'snag') => void
}) => {
  return (
    <div className={`${styles.mobileNavigation} ${styles.mobileFadeIn}`}>
      {/* Основные действия */}
      <div className={styles.mobilePrimaryActions}>
        <Group grow>
          <Button 
            component={Link}
            to={waterPageUrl}
            variant="filled" 
            color="blue" 
            size="sm"
            className={`${styles.mobileButton} ${styles.touchFriendly}`}
            style={{ fontWeight: 'bold' }}
          >
            🌊 На воде
          </Button>
          <Button 
            variant={notifEnabled ? 'filled' : 'light'} 
            onClick={onToggleNotifications}
            size="sm"
            className={`${styles.mobileButton} ${styles.touchFriendly}`}
          >
            {notifEnabled ? '🔔' : '🔕'}
          </Button>
        </Group>
      </div>
      
      {/* Быстрые действия */}
      <div className={styles.mobileSecondaryActions}>
        <div className={styles.mobileQuickActions}>
          <QuickPinButton kind="strike" onQuickPin={onQuickPin} isMobile={true} />
          <QuickPinButton kind="lost" onQuickPin={onQuickPin} isMobile={true} />
          <QuickPinButton kind="snag" onQuickPin={onQuickPin} color="orange" isMobile={true} />
        </div>
      </div>
    </div>
  )
})

MobileNavigation.displayName = 'MobileNavigation'

// Десктопная навигация
const DesktopNavigation = memo(({ 
  waterPageUrl, 
  onToggleNotifications, 
  notifEnabled,
  onQuickPin,
  countdownText,
  countdownKind
}: { 
  waterPageUrl: string
  onToggleNotifications: () => Promise<void>
  notifEnabled: boolean
  onQuickPin: (kind: 'strike' | 'lost' | 'snag') => void
  countdownText: string | null
  countdownKind: 'starts' | 'ends' | 'next' | null
}) => {
  return (
    <Group>
      {countdownText && countdownKind && (
        <CountdownBadge 
          countdownText={countdownText} 
          countdownKind={countdownKind} 
        />
      )}
      
      <Button 
        variant={notifEnabled ? 'filled' : 'light'} 
        onClick={onToggleNotifications}
      >
        {notifEnabled ? 'Напоминания включены' : 'Включить напоминания'}
      </Button>
      
      <Button 
        component={Link}
        to={waterPageUrl}
        variant="filled" 
        color="blue" 
        size="sm"
        style={{ fontWeight: 'bold' }}
      >
        🌊 На воде
      </Button>
      
      <QuickPinButton kind="strike" onQuickPin={onQuickPin} />
      <QuickPinButton kind="lost" onQuickPin={onQuickPin} />
      <QuickPinButton kind="snag" onQuickPin={onQuickPin} color="orange" />
    </Group>
  )
})

DesktopNavigation.displayName = 'DesktopNavigation'

export const TrainingHeader = memo(function TrainingHeader({
  training,
  countdownText,
  countdownKind,
  notifEnabled,
  onToggleNotifications,
  onQuickPin,
  currentRig
}: TrainingHeaderProps) {
  const theme = useMantineTheme()
  const isMobile = useMediaQuery(`(max-width: ${theme.breakpoints.sm})`)
  
  // Мемоизируем обработчик уведомлений
  const handleToggleNotifications = useCallback(async () => {
    await onToggleNotifications()
  }, [onToggleNotifications])
  
  // Мемоизируем URL для кнопки "На воде"
  const waterPageUrl = useMemo(() => 
    `/training/${training.id}/water`, [training.id]
  )
  
  return (
    <Box className={isMobile ? styles.mobileContainer : styles.desktopContainer}>
      {/* Основная информация с кнопкой "Назад" */}
      <Stack 
        gap={isMobile ? 'xs' : 'md'} 
        mb={isMobile ? 'md' : 'lg'}
        className={styles.responsiveStack}
      >
        {/* Заголовок с кнопкой "Назад" */}
        <Group justify="space-between" align="center" wrap="nowrap">
          <Title 
            order={isMobile ? 3 : 2}
            className={isMobile ? styles.mobileTitle : styles.desktopTitle}
            style={{ flex: 1 }}
          >
            {training.title}
          </Title>
          <BackButton training={training} isMobile={isMobile} />
        </Group>
        
        <Group 
          gap="xs" 
          wrap="wrap"
          className={`${styles.responsiveGroup} ${isMobile ? styles.mobileInfoGroup : ''}`}
        >
          <TrainingTypeBadge type={training.type} isMobile={isMobile} />
          <TimeDisplay label="Начало" date={training.starts_at} isMobile={isMobile} />
          {training.ends_at && (
            <TimeDisplay label="Окончание" date={training.ends_at} isMobile={isMobile} />
          )}
        </Group>
        
        {currentRig && <CurrentRigIndicator currentRig={currentRig} />}
        <CurrentTargetFishSelector />
      </Stack>
      
      {/* Навигация */}
      {isMobile ? (
        <MobileNavigation
          waterPageUrl={waterPageUrl}
          onToggleNotifications={handleToggleNotifications}
          notifEnabled={notifEnabled}
          onQuickPin={onQuickPin}
        />
      ) : (
        <DesktopNavigation
          waterPageUrl={waterPageUrl}
          onToggleNotifications={handleToggleNotifications}
          notifEnabled={notifEnabled}
          onQuickPin={onQuickPin}
          countdownText={countdownText}
          countdownKind={countdownKind}
        />
      )}
    </Box>
  )
})
