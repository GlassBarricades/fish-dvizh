import { useEffect, useState } from 'react'
import { Button, Group, MultiSelect, Stack, TextInput, Textarea, Select, NumberInput } from '@mantine/core'
import { DateTimePicker } from '@mantine/dates'
import { useDeleteCompetition, useSetCompetitionFishKinds, useUpdateCompetition, useCompetitionFishKinds } from './hooks'
import { useFishKinds } from '../dicts/fish/hooks'
import { useCompetitionFormats } from '../dicts/formats/hooks'
import { useTeamSizes } from '../dicts/teamSizes/hooks'

type Props = {
  id: string
  title: string
  description?: string | null
  starts_at: string
  lat: number
  lng: number
  fish_kind_id?: string | null
  format_id?: string | null
  team_size_id?: string | null
  max_slots?: number | null
  onClose: () => void
}

export function EditCompetitionModal(props: Props) {
  const [title, setTitle] = useState(props.title)
  const [description, setDescription] = useState(props.description ?? '')
  const [startsAt, setStartsAt] = useState<string | null>(props.starts_at)
  const { mutateAsync: update, isPending } = useUpdateCompetition()
  const { mutateAsync: del, isPending: deleting } = useDeleteCompetition()
  const { data: fishKinds } = useFishKinds()
  const { data: formats } = useCompetitionFormats()
  const { data: teamSizes } = useTeamSizes()
  const { data: currentFishKinds } = useCompetitionFishKinds(props.id)
  const [fishKindIds, setFishKindIds] = useState<string[]>([])
  const [formatId, setFormatId] = useState<string | null>(props.format_id ?? null)
  const [teamSizeId, setTeamSizeId] = useState<string | null>(props.team_size_id ?? null)
  const [maxSlots, setMaxSlots] = useState<number | ''>(props.max_slots ?? '')
  const { mutateAsync: setFishKinds } = useSetCompetitionFishKinds()

  useEffect(() => {
    if (currentFishKinds) {
      setFishKindIds(currentFishKinds)
    }
  }, [currentFishKinds])

  async function handleSave() {
    if (!title.trim() || !startsAt) return
    await update({ id: props.id, input: { title: title.trim(), description: description || undefined, starts_at: startsAt, format_id: formatId ?? null, team_size_id: teamSizeId ?? null, max_slots: maxSlots === '' ? null : Number(maxSlots) } })
    await setFishKinds({ competitionId: props.id, fishKindIds })
    props.onClose()
  }

  async function handleDelete() {
    await del(props.id)
    props.onClose()
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
      />
      <Select
        label="Размер команды"
        placeholder="Выберите размер команды"
        data={(teamSizes ?? []).map((s) => ({ value: s.id, label: `${s.name} (${s.size})` }))}
        value={teamSizeId}
        onChange={setTeamSizeId}
        searchable
        nothingFoundMessage="Нет данных"
      />
      <Textarea label="Описание" value={description} onChange={(e) => setDescription(e.currentTarget.value)} minRows={3} />
      <NumberInput
        label={teamSizes?.find((s) => s.id === teamSizeId)?.size === 1 ? 'Лимит участников (соло)' : 'Лимит команд'}
        placeholder="Без лимита"
        value={maxSlots}
        onChange={(value) => setMaxSlots(value === '' ? '' : Number(value))}
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
      />
      <Group justify="space-between">
        <Button color="red" variant="light" onClick={handleDelete} loading={deleting}>
          Удалить
        </Button>
        <Group>
          <Button variant="subtle" onClick={props.onClose}>Отмена</Button>
          <Button onClick={handleSave} loading={isPending}>Сохранить</Button>
        </Group>
      </Group>
    </Stack>
  )
}


