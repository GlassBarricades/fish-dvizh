import { useState } from 'react'
import { Button, Group, MultiSelect, Stack, TextInput, Textarea, Select, NumberInput } from '@mantine/core'
import { DateTimePicker } from '@mantine/dates'
import dayjs from 'dayjs'
import { useCreateCompetition, useSetCompetitionFishKinds } from './hooks'
import { useFishKinds } from '../dicts/fish/hooks'
import { useCompetitionFormats } from '../dicts/formats/hooks'
import { useTeamSizes } from '../dicts/teamSizes/hooks'
import { notifications } from '@mantine/notifications'

type Props = {
  lat: number
  lng: number
  onClose: () => void
}

export function CreateCompetitionModal({ lat, lng, onClose }: Props) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [startsAt, setStartsAt] = useState<string | null>(dayjs().toISOString())
  const { mutateAsync, isPending } = useCreateCompetition()
  const { mutateAsync: setFishKinds } = useSetCompetitionFishKinds()
  const { data: fishKinds } = useFishKinds()
  const { data: formats } = useCompetitionFormats()
  const { data: teamSizes } = useTeamSizes()
  const [fishKindIds, setFishKindIds] = useState<string[]>([])
  const [formatId, setFormatId] = useState<string | null>(null)
  const [teamSizeId, setTeamSizeId] = useState<string | null>(null)
  const [maxSlots, setMaxSlots] = useState<number | ''>('')

  async function handleSubmit() {
    if (!title.trim() || !startsAt || fishKindIds.length === 0 || !formatId || !teamSizeId) {
      notifications.show({ color: 'red', message: 'Заполните название, дату/время, выберите виды рыбы, формат и размер команды' })
      return
    }
    try {
      const created = await mutateAsync({
        title: title.trim(),
        description: description.trim() || undefined,
        starts_at: startsAt,
        lat,
        lng,
        format_id: formatId,
        team_size_id: teamSizeId,
        max_slots: maxSlots === '' ? null : Number(maxSlots),
      })
      await setFishKinds({ competitionId: created.id, fishKindIds })
      notifications.show({ color: 'green', message: 'Соревнование создано' })
      onClose()
    } catch (e: any) {
      notifications.show({ color: 'red', message: e?.message ?? 'Ошибка создания' })
    }
  }

  return (
    <Stack>
      <TextInput label="Название" value={title} onChange={(e) => setTitle(e.currentTarget.value)} required />
      <DateTimePicker
        label="Дата и время"
        value={startsAt}
        onChange={setStartsAt}
        required
        popoverProps={{ zIndex: 10001, withinPortal: true }}
      />
      <Select
        label="Формат соревнования"
        placeholder="Выберите формат"
        data={(formats ?? []).map((f) => ({ value: f.id, label: f.name }))}
        value={formatId}
        onChange={setFormatId}
        searchable
        nothingFoundMessage="Нет данных"
        required
      />
      <Select
        label="Размер команды"
        placeholder="Выберите размер команды"
        data={(teamSizes ?? []).map((s) => ({ value: s.id, label: `${s.name} (${s.size})` }))}
        value={teamSizeId}
        onChange={setTeamSizeId}
        searchable
        nothingFoundMessage="Нет данных"
        required
      />
      <Textarea label="Описание" value={description} onChange={(e) => setDescription(e.currentTarget.value)} minRows={3} />
      <NumberInput
        label={teamSizes?.find((s) => s.id === teamSizeId)?.size === 1 ? 'Лимит участников (соло)' : 'Лимит команд'}
        placeholder="Без лимита"
        value={maxSlots}
        onChange={setMaxSlots}
        min={1}
        clampBehavior="strict"
      />
      <MultiSelect
        label="Целевая рыба"
        placeholder="Выберите виды"
        data={(fishKinds ?? []).map((f) => ({ value: f.id, label: f.name }))}
        value={fishKindIds}
        onChange={setFishKindIds}
        searchable
        nothingFoundMessage="Нет данных"
        required
      />
      <Group justify="flex-end">
        <Button variant="subtle" onClick={onClose}>Отмена</Button>
        <Button onClick={handleSubmit} loading={isPending}>Создать</Button>
      </Group>
    </Stack>
  )
}


