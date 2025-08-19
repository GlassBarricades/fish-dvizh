import { useParams, Link } from 'react-router-dom'
import { Paper, Stack, Title, Button, Group } from '@mantine/core'
import { useAggregatedStandings, useTeamStandingsByPlaces } from '../features/results/hooks'

export default function ResultsPublicPage() {
  const { competitionId } = useParams()
  const { data: personal } = useAggregatedStandings(competitionId || '')
  const { data: teams } = useTeamStandingsByPlaces(competitionId || '')

  function exportCSV(rows: any[], headers: string[], name: string) {
    const lines = [headers.join(',')]
    for (const r of rows) lines.push(headers.map((h) => JSON.stringify((r as any)[h] ?? '')).join(','))
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${name}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Stack p="md" gap="md">
      <Group justify="space-between">
        <Title order={2}>Итоги соревнования</Title>
        {competitionId && <Button component={Link} to={`/competition/${competitionId}`} variant="subtle">К странице соревнования</Button>}
      </Group>
      <Paper p="md" withBorder>
        <Stack>
          <Group justify="space-between">
            <Title order={3}>Личный зачёт</Title>
            <Button variant="light" onClick={() => exportCSV(personal || [], ['userId','totalWeight','totalCount'], 'personal_results')}>Экспорт CSV</Button>
          </Group>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left' }}>Место</th>
                <th style={{ textAlign: 'left' }}>Участник</th>
                <th style={{ textAlign: 'left' }}>Сумма веса (г)</th>
                <th style={{ textAlign: 'left' }}>Кол-во рыбин</th>
              </tr>
            </thead>
            <tbody>
              {(personal || []).map((r, i) => (
                <tr key={r.userId}>
                  <td>{i + 1}</td>
                  <td>{r.userId}</td>
                  <td>{Math.round(r.totalWeight)}</td>
                  <td>{r.totalCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Stack>
      </Paper>
      <Paper p="md" withBorder>
        <Stack>
          <Group justify="space-between">
            <Title order={3}>Командный зачёт (сумма мест)</Title>
            <Button variant="light" onClick={() => exportCSV(teams || [], ['teamId','teamName','sumPlaces','totalWeight'], 'team_results')}>Экспорт CSV</Button>
          </Group>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left' }}>Место</th>
                <th style={{ textAlign: 'left' }}>Команда</th>
                <th style={{ textAlign: 'left' }}>Сумма мест</th>
                <th style={{ textAlign: 'left' }}>Вес (г)</th>
              </tr>
            </thead>
            <tbody>
              {(teams || []).map((r: any, i: number) => (
                <tr key={r.teamId}>
                  <td>{i + 1}</td>
                  <td>{r.teamName}</td>
                  <td>{r.sumPlaces}</td>
                  <td>{Math.round(r.totalWeight)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Stack>
      </Paper>
    </Stack>
  )
}


