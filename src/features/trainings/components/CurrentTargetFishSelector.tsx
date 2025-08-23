import { Select, Group, Text, Badge } from '@mantine/core'
import { useMemo, memo } from 'react'
import { useTrainingContext } from '../context/TrainingContext'
import { useFishKinds } from '../../dicts/fish/hooks'

export const CurrentTargetFishSelector = memo(function CurrentTargetFishSelector() {
  const { state, setCurrentTargetFish } = useTrainingContext()
  const { data: fishKinds } = useFishKinds()
  
  // Получаем доступные виды рыбы для тренировки
  const availableFishKinds = useMemo(() => {
    if (!state.training?.target_fish_kinds || !fishKinds) return []
    
    return fishKinds.filter(fish => 
      state.training!.target_fish_kinds!.includes(fish.id)
    )
  }, [state.training?.target_fish_kinds, fishKinds])
  
  // Получаем текущую выбранную рыбу
  const currentTargetFish = useMemo(() => {
    if (!state.currentTargetFish || !fishKinds) return null
    return fishKinds.find(fish => fish.id === state.currentTargetFish)
  }, [state.currentTargetFish, fishKinds])
  
  // Если нет доступных видов рыбы, показываем сообщение
  if (availableFishKinds.length === 0) {
    return (
      <Text size="sm" c="red" fw={500}>
        Нет доступных видов рыбы
      </Text>
    )
  }
  
  return (
    <Group gap="xs" align="center">
      <Text size="sm" c="dimmed" fw={500}>
        Целевая рыба:
      </Text>
      
      <Select
        placeholder="Выберите рыбу"
        data={availableFishKinds.map(fish => ({ 
          value: fish.id, 
          label: fish.name 
        }))}
        value={state.currentTargetFish || ''}
        onChange={(value) => setCurrentTargetFish(value)}
        size="xs"
        style={{ minWidth: 150 }}
        clearable
        searchable
      />
      
      {currentTargetFish && (
        <Badge variant="light" color="blue" size="sm">
          🎯 {currentTargetFish.name}
        </Badge>
      )}
    </Group>
  )
})
