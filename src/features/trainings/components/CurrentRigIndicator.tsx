import { Badge, Group, Text, useMantineTheme } from '@mantine/core'
import { useMemo, memo } from 'react'
import { useMediaQuery } from '@mantine/hooks'
import type { TrainingTakenUserBait } from '../api'

interface CurrentRigIndicatorProps {
  currentRig: {
    bait: TrainingTakenUserBait | null
    weight: number
  } | null
}

// Мемоизированный компонент для отображения бейджа приманки
const BaitBadge = memo(({ 
  value, 
  color,
  isMobile = false
}: { 
  value: string | null
  color: string
  isMobile?: boolean
}) => {
  if (!value) return null
  
  return (
    <Badge 
      color={color} 
      variant="filled" 
      size={isMobile ? 'xs' : 'sm'}
      style={{
        fontSize: isMobile ? '10px' : undefined,
        padding: isMobile ? '4px 8px' : undefined
      }}
    >
      {value}
    </Badge>
  )
})

BaitBadge.displayName = 'BaitBadge'

// Мемоизированный компонент для отображения веса груза
const WeightBadge = memo(({ weight, isMobile = false }: { weight: number; isMobile?: boolean }) => {
  if (weight <= 0) return null
  
  return (
    <Badge 
      color="red" 
      variant="filled" 
      size={isMobile ? 'xs' : 'sm'}
      style={{
        fontSize: isMobile ? '10px' : undefined,
        padding: isMobile ? '4px 8px' : undefined
      }}
    >
      {isMobile ? `${weight}г` : `Груз: ${weight}г`}
    </Badge>
  )
})

WeightBadge.displayName = 'WeightBadge'

export const CurrentRigIndicator = memo(function CurrentRigIndicator({ 
  currentRig 
}: CurrentRigIndicatorProps) {
  const theme = useMantineTheme()
  const isMobile = useMediaQuery(`(max-width: ${theme.breakpoints.sm})`)
  
  // Мемоизируем проверку наличия оснастки
  const hasRig = useMemo(() => 
    currentRig && currentRig.bait, [currentRig]
  )
  
  // Мемоизируем данные приманки
  const baitData = useMemo(() => {
    if (!currentRig?.bait) return null
    
    return {
      brand: currentRig.bait.brand || 'Без бренда',
      name: currentRig.bait.name || 'Без названия',
      color: currentRig.bait.color || null,
      size: currentRig.bait.size || null,
      weight: currentRig.weight
    }
  }, [currentRig])
  
  if (!hasRig || !baitData) {
    return null
  }
  
  return (
    <Group gap={isMobile ? 'xs' : 'sm'} align="center" wrap="wrap">
      <Text 
        size={isMobile ? 'xs' : 'sm'} 
        c="dimmed" 
        fw={500}
        style={{ minWidth: isMobile ? 'auto' : '120px' }}
      >
        {isMobile ? 'Оснастка:' : 'Текущая оснастка:'}
      </Text>
      <Group gap={isMobile ? 'xs' : 'sm'} wrap="wrap">
        <BaitBadge value={baitData.brand} color="blue" isMobile={isMobile} />
        <BaitBadge value={baitData.name} color="green" isMobile={isMobile} />
        <BaitBadge value={baitData.color} color="orange" isMobile={isMobile} />
        <BaitBadge value={baitData.size} color="purple" isMobile={isMobile} />
        <WeightBadge weight={baitData.weight} isMobile={isMobile} />
      </Group>
    </Group>
  )
})
