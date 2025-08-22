import { Card, Title, Stack, Group, Badge, Text, Button, Collapse } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { IconChevronDown, IconChevronUp, IconBulb } from '@tabler/icons-react'
import { useSmartNotifications } from '../hooks/useSmartNotifications'
import { useMemo, useCallback, memo } from 'react'

// Мемоизированный компонент для отображения подсказки
const TipCard = memo(({ 
  tip, 
  bgColor 
}: { 
  tip: { message: string; action?: () => void }
  bgColor: string
}) => {
  const handleAction = useCallback(() => {
    if (tip.action) {
      tip.action()
    }
  }, [tip.action])
  
  return (
    <Card withBorder p="xs" mb="xs" bg={bgColor}>
      <Group justify="space-between" align="flex-start">
        <Text size="sm" style={{ flex: 1 }}>
          {tip.message}
        </Text>
        {tip.action && (
          <Button size="xs" variant="filled" color="red" onClick={handleAction}>
            Действие
          </Button>
        )}
      </Group>
    </Card>
  )
})

TipCard.displayName = 'TipCard'

// Мемоизированный компонент для отображения группы подсказок
const TipsGroup = memo(({ 
  tips, 
  title, 
  icon, 
  color, 
  bgColor 
}: { 
  tips: Array<{ message: string; action?: () => void }>
  title: string
  icon: string
  color: string
  bgColor: string
}) => {
  if (tips.length === 0) return null
  
  return (
    <div>
      <Text size="sm" fw={600} c={color} mb="xs">
        {icon} {title}:
      </Text>
      {tips.map((tip, index) => (
        <TipCard key={index} tip={tip} bgColor={bgColor} />
      ))}
    </div>
  )
})

TipsGroup.displayName = 'TipsGroup'

// Мемоизированный компонент для отображения статистики
const StatsCard = memo(({ 
  baitEffectiveness, 
  timeEffectiveness, 
  techniqueAnalysis 
}: { 
  baitEffectiveness: any
  timeEffectiveness: any
  techniqueAnalysis: any
}) => {
  const hasStats = useMemo(() => 
    baitEffectiveness || timeEffectiveness || techniqueAnalysis, 
    [baitEffectiveness, timeEffectiveness, techniqueAnalysis]
  )
  
  if (!hasStats) return null
  
  return (
    <Card withBorder p="xs" bg="gray.0">
      <Title order={6} mb="xs">📊 Анализ эффективности</Title>
      <Stack gap="xs">
        {baitEffectiveness && (
          <Group gap="xs">
            <Text size="xs" c="dimmed">Лучшая приманка:</Text>
            <Badge color="green" variant="light" size="sm">
              {baitEffectiveness[0]?.baitName} ({baitEffectiveness[0]?.count} поимок)
            </Badge>
          </Group>
        )}
        
        {timeEffectiveness !== null && (
          <Group gap="xs">
            <Text size="xs" c="dimmed">Лучшее время:</Text>
            <Badge color="blue" variant="light" size="sm">
              {timeEffectiveness}:00
            </Badge>
          </Group>
        )}
        
        {techniqueAnalysis && (
          <Group gap="xs">
            <Text size="xs" c="dimmed">Процент отпущенной рыбы:</Text>
            <Badge 
              color={techniqueAnalysis.releaseRate > 0.5 ? 'green' : 'orange'} 
              variant="light" 
              size="sm"
            >
              {Math.round(techniqueAnalysis.releaseRate * 100)}%
            </Badge>
          </Group>
        )}
      </Stack>
    </Card>
  )
})

StatsCard.displayName = 'StatsCard'

export const TrainingTips = memo(function TrainingTips() {
  const [opened, { toggle }] = useDisclosure(false)
  const { tips, baitEffectiveness, timeEffectiveness, techniqueAnalysis } = useSmartNotifications()
  
  // Мемоизируем фильтрацию подсказок по приоритету
  const { highPriorityTips, mediumPriorityTips, lowPriorityTips } = useMemo(() => ({
    highPriorityTips: tips.filter(tip => tip.priority === 'high'),
    mediumPriorityTips: tips.filter(tip => tip.priority === 'medium'),
    lowPriorityTips: tips.filter(tip => tip.priority === 'low')
  }), [tips])
  
  // Мемоизируем обработчик переключения
  const handleToggle = useCallback(() => {
    toggle()
  }, [toggle])
  
  // Мемоизируем иконку для кнопки
  const toggleIcon = useMemo(() => 
    opened ? <IconChevronUp size={16} /> : <IconChevronDown size={16} />, 
    [opened]
  )
  
  // Мемоизируем текст кнопки
  const toggleText = useMemo(() => 
    opened ? 'Скрыть' : 'Показать', 
    [opened]
  )
  
  if (tips.length === 0) {
    return null
  }

  return (
    <Card withBorder p="md" mb="md">
      <Group justify="space-between" align="center" mb="md">
        <Group gap="xs">
          <IconBulb size={20} color="#FFD700" />
          <Title order={5}>💡 Умные подсказки</Title>
          <Badge color="blue" variant="light">
            {tips.length}
          </Badge>
        </Group>
        <Button
          variant="light"
          size="sm"
          onClick={handleToggle}
          rightSection={toggleIcon}
        >
          {toggleText}
        </Button>
      </Group>

      <Collapse in={opened}>
        <Stack gap="md">
          <TipsGroup 
            tips={highPriorityTips}
            title="Важные рекомендации"
            icon="🔴"
            color="red"
            bgColor="red.0"
          />
          
          <TipsGroup 
            tips={mediumPriorityTips}
            title="Полезные советы"
            icon="🟡"
            color="orange"
            bgColor="orange.0"
          />
          
          <TipsGroup 
            tips={lowPriorityTips}
            title="Дополнительная информация"
            icon="🔵"
            color="blue"
            bgColor="blue.0"
          />
          
          <StatsCard 
            baitEffectiveness={baitEffectiveness}
            timeEffectiveness={timeEffectiveness}
            techniqueAnalysis={techniqueAnalysis}
          />
        </Stack>
      </Collapse>
    </Card>
  )
})
