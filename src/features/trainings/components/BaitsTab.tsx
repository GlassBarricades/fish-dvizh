import { Stack, Group, Title, Button, Card, Text } from '@mantine/core'
import type { TrainingCatch } from '../api'

interface BaitsTabProps {
  takenBaits: any[]
  catches: TrainingCatch[]
  onOpenManageBaits: () => void
}

export function BaitsTab({
  takenBaits,
  catches,
  onOpenManageBaits
}: BaitsTabProps) {
  const getBaitLabel = (bait: any) => {
    return `${bait.brand ?? ''} ${bait.name ?? ''}${bait.color ? ' ' + bait.color : ''}${bait.size ? ' ' + bait.size : ''}`.trim()
  }

  const getBaitCount = (bait: any) => {
    const label = getBaitLabel(bait).toLowerCase()
    return catches.filter((c) => {
      const direct = !!bait.dict_bait_id && c.bait_id === bait.dict_bait_id
      const textLabel = ((c as any).dict_baits
        ? `${(c as any).dict_baits.brand ?? ''} ${(c as any).dict_baits.name ?? ''} ${(c as any).dict_baits.color ?? ''} ${(c as any).dict_baits.size ?? ''}`
        : (c.bait_name || '')).trim().toLowerCase()
      return direct || (textLabel !== '' && textLabel === label)
    }).length
  }

  return (
    <Stack gap="sm">
      <Group justify="space-between">
        <Title order={5}>Мои приманки</Title>
        <Button variant="light" onClick={onOpenManageBaits}>
          Управлять
        </Button>
      </Group>
      
      <Card withBorder p="md">
        <Stack gap={6}>
          {takenBaits.length === 0 && <Text c="dimmed">Список пуст</Text>}
          {takenBaits.map((bait) => (
            <Group key={bait.user_bait_id} justify="space-between">
              <Text>{getBaitLabel(bait)}</Text>
              <Text c="dimmed">{getBaitCount(bait)}</Text>
            </Group>
          ))}
        </Stack>
      </Card>
    </Stack>
  )
}
