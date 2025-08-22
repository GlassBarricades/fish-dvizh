import { useState, useEffect, useMemo } from 'react'
import { Modal, Stack, TextInput, Divider, ScrollArea, Checkbox, Group, Button } from '@mantine/core'
import { useAuth } from '../../auth/hooks'
import { useBaits } from '../../dicts/baits/hooks'
import { useUserBaits } from '../../userBaits/hooks'

interface ManageTakenBaitsModalProps {
  opened: boolean
  onClose: () => void
  baits?: { id: string; label: string }[]
  selectedIds: Set<string>
  onSave: (ids: string[]) => Promise<void>
  baitsSource?: 'dict' | 'user'
}

export function ManageTakenBaitsModal({
  opened,
  onClose,
  baits,
  selectedIds,
  onSave,
  baitsSource
}: ManageTakenBaitsModalProps) {
  const [query, setQuery] = useState('')
  const [checked, setChecked] = useState<Set<string>>(new Set(selectedIds))
  const { user } = useAuth()
  const { data: dictBaits } = useBaits()
  const { data: userBaits } = useUserBaits(user?.id)

  useEffect(() => { 
    setChecked(new Set(selectedIds)) 
  }, [opened, selectedIds])

  const options: { id: string; label: string }[] = useMemo(() => {
    if (baits && baits.length > 0) return baits
    if (baitsSource === 'user') {
      return (userBaits ?? []).map((ub: any) => ({ 
        id: ub.id, 
        label: `${ub.brand ?? ''} ${ub.name ?? ''}${ub.color ? ' ' + ub.color : ''}${ub.size ? ' ' + ub.size : ''}`.trim() 
      }))
    }
    return (dictBaits ?? []).map((b: any) => ({ 
      id: b.id, 
      label: `${b.brand ?? ''} ${b.name ?? ''}${b.color ? ' ' + b.color : ''}${b.size ? ' ' + b.size : ''}`.trim() 
    }))
  }, [baits, baitsSource, userBaits, dictBaits])

  const filtered = options.filter(b => b.label.toLowerCase().includes(query.toLowerCase()))
  
  const toggle = (id: string) => {
    const next = new Set(checked)
    if (next.has(id)) {
      next.delete(id)
    } else {
      next.add(id)
    }
    setChecked(next)
  }

  const handleSave = () => {
    onSave(Array.from(checked))
  }

  return (
    <Modal opened={opened} onClose={onClose} title="Мои приманки" size="lg">
      <Stack>
        <TextInput 
          placeholder="Поиск" 
          value={query} 
          onChange={(e) => setQuery(e.currentTarget.value)} 
        />
        <Divider />
        <ScrollArea style={{ height: 360 }}>
          <Stack>
            {filtered.map(b => (
              <Checkbox 
                key={b.id} 
                label={b.label} 
                checked={checked.has(b.id)} 
                onChange={() => toggle(b.id)} 
              />
            ))}
            {filtered.length === 0 && <div style={{ color: 'gray' }}>Ничего не найдено</div>}
          </Stack>
        </ScrollArea>
        <Group justify="flex-end">
          <Button variant="outline" onClick={onClose}>
            Отмена
          </Button>
          <Button onClick={handleSave}>
            Сохранить
          </Button>
        </Group>
      </Stack>
    </Modal>
  )
}
