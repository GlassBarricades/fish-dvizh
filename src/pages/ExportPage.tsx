import { useState } from 'react'
import {
  Box,
  Button,
  Card,
  Checkbox,
  Container,
  Group,
  NumberInput,
  Paper,
  Select,
  Stack,
  Text,
  TextInput,
  Title,
  Grid,
  Badge,
  Divider,
  Alert,
  ActionIcon,
  Tooltip
} from '@mantine/core'
import { DatePickerInput } from '@mantine/dates'
import { IconDownload, IconFileExport, IconInfoCircle } from '@tabler/icons-react'
import { useExportWithDownload, useExportStats } from '@/features/export/hooks'
import { useActiveLeagues } from '@/features/leagues/hooks'
import { useUpcomingCompetitions } from '@/features/competitions/model/hooks'
import { useAuth } from '@/features/auth/hooks'
import type { ExportFormat, ExportConfig } from '@/features/export/types'

export default function ExportPage() {
  const { user } = useAuth()
  const { handleExport, isLoading } = useExportWithDownload()
  const { data: exportStats } = useExportStats()
  const { data: activeLeagues } = useActiveLeagues()
  const { data: upcomingCompetitions } = useUpcomingCompetitions(10)

  // Состояние для конфигурации экспорта
  const [exportConfig, setExportConfig] = useState<ExportConfig>({
    format: 'csv',
    includeHeaders: true,
    columns: []
  })

  // Состояние для экспорта рейтинга лиги
  const [leagueExport, setLeagueExport] = useState({
    leagueId: '',
    includeUserDetails: true,
    includeStatistics: true
  })

  // Состояние для экспорта результатов соревнования
  const [competitionExport, setCompetitionExport] = useState({
    competitionId: '',
    includeFishDetails: true,
    includeZoneDetails: false
  })

  // Состояние для экспорта статистики пользователя
  const [userStatsExport, setUserStatsExport] = useState({
    includeAchievements: true,
    includeRewards: true,
    includeTrainingData: false
  })

  // Состояние для экспорта достижений
  const [achievementsExport, setAchievementsExport] = useState({
    includeProgress: true
  })

  const handleLeagueExport = async () => {
    if (!leagueExport.leagueId) {
      return
    }

    await handleExport('league', {
      leagueId: leagueExport.leagueId,
      config: exportConfig,
      includeUserDetails: leagueExport.includeUserDetails,
      includeStatistics: leagueExport.includeStatistics
    })
  }

  const handleCompetitionExport = async () => {
    if (!competitionExport.competitionId) {
      return
    }

    await handleExport('competition', {
      competitionId: competitionExport.competitionId,
      config: exportConfig,
      includeFishDetails: competitionExport.includeFishDetails,
      includeZoneDetails: competitionExport.includeZoneDetails
    })
  }

  const handleUserStatsExport = async () => {
    if (!user?.id) {
      return
    }

    await handleExport('user', {
      userId: user.id,
      config: exportConfig,
      includeAchievements: userStatsExport.includeAchievements,
      includeRewards: userStatsExport.includeRewards,
      includeTrainingData: userStatsExport.includeTrainingData
    })
  }

  const handleAchievementsExport = async () => {
    await handleExport('achievements', {
      userId: user?.id,
      config: exportConfig,
      includeProgress: achievementsExport.includeProgress
    })
  }

  return (
    <Container size="lg" py="md">
      <Stack gap="lg">
        <Box>
          <Title order={2} mb="sm">Экспорт данных</Title>
          <Text c="dimmed" size="sm">
            Экспортируйте данные в различных форматах для анализа и отчетности
          </Text>
        </Box>

        {/* Статистика экспорта */}
        {exportStats && (
          <Card withBorder>
            <Card.Section p="md">
              <Group justify="space-between">
                <Title order={4}>Статистика экспорта</Title>
                <Badge variant="light" color="blue">
                  Всего экспортов: {exportStats.totalExports}
                </Badge>
              </Group>
            </Card.Section>
            <Card.Section p="md" pt={0}>
              <Grid>
                <Grid.Col span={6}>
                  <Text size="sm" fw={500} mb="xs">По форматам:</Text>
                  <Stack gap="xs">
                    {Object.entries(exportStats.exportsByFormat).map(([format, count]) => (
                      <Group key={format} justify="space-between">
                        <Text size="sm" tt="uppercase">{format}</Text>
                        <Badge variant="outline" size="sm">{count}</Badge>
                      </Group>
                    ))}
                  </Stack>
                </Grid.Col>
                <Grid.Col span={6}>
                  <Text size="sm" fw={500} mb="xs">По типам:</Text>
                  <Stack gap="xs">
                    {Object.entries(exportStats.exportsByType).map(([type, count]) => (
                      <Group key={type} justify="space-between">
                        <Text size="sm">{type.replace('_', ' ')}</Text>
                        <Badge variant="outline" size="sm">{count}</Badge>
                      </Group>
                    ))}
                  </Stack>
                </Grid.Col>
              </Grid>
            </Card.Section>
          </Card>
        )}

        {/* Общие настройки экспорта */}
        <Card withBorder>
          <Card.Section p="md">
            <Title order={4}>Общие настройки</Title>
          </Card.Section>
          <Card.Section p="md" pt={0}>
            <Grid>
              <Grid.Col span={6}>
                <Select
                  label="Формат файла"
                  placeholder="Выберите формат"
                  value={exportConfig.format}
                  onChange={(value) => setExportConfig(prev => ({ 
                    ...prev, 
                    format: value as ExportFormat 
                  }))}
                  data={[
                    { value: 'csv', label: 'CSV (Excel)' },
                    { value: 'xlsx', label: 'Excel (.xlsx)' },
                    { value: 'pdf', label: 'PDF' },
                    { value: 'json', label: 'JSON' }
                  ]}
                />
              </Grid.Col>
              <Grid.Col span={6}>
                <Checkbox
                  label="Включить заголовки"
                  checked={exportConfig.includeHeaders}
                  onChange={(event) => setExportConfig(prev => ({ 
                    ...prev, 
                    includeHeaders: event.currentTarget.checked 
                  }))}
                />
              </Grid.Col>
            </Grid>
          </Card.Section>
        </Card>

        {/* Экспорт рейтинга лиги */}
        <Card withBorder>
          <Card.Section p="md">
            <Group justify="space-between">
              <Title order={4}>Экспорт рейтинга лиги</Title>
              <Tooltip label="Экспортировать текущий рейтинг участников лиги">
                <ActionIcon variant="subtle" color="blue">
                  <IconInfoCircle size={16} />
                </ActionIcon>
              </Tooltip>
            </Group>
          </Card.Section>
          <Card.Section p="md" pt={0}>
            <Stack gap="md">
              <Select
                label="Выберите лигу"
                placeholder="Выберите лигу для экспорта"
                value={leagueExport.leagueId}
                onChange={(value) => setLeagueExport(prev => ({ 
                  ...prev, 
                  leagueId: value || '' 
                }))}
                data={(activeLeagues || []).map(league => ({
                  value: league.id,
                  label: `${league.name} (${league.season})`
                }))}
                searchable
              />
              
              <Group>
                <Checkbox
                  label="Включить детали пользователей"
                  checked={leagueExport.includeUserDetails}
                  onChange={(event) => setLeagueExport(prev => ({ 
                    ...prev, 
                    includeUserDetails: event.currentTarget.checked 
                  }))}
                />
                <Checkbox
                  label="Включить статистику"
                  checked={leagueExport.includeStatistics}
                  onChange={(event) => setLeagueExport(prev => ({ 
                    ...prev, 
                    includeStatistics: event.currentTarget.checked 
                  }))}
                />
              </Group>

              <Button
                leftSection={<IconDownload size={16} />}
                onClick={handleLeagueExport}
                disabled={!leagueExport.leagueId || isLoading}
                loading={isLoading}
              >
                Экспортировать рейтинг лиги
              </Button>
            </Stack>
          </Card.Section>
        </Card>

        {/* Экспорт результатов соревнования */}
        <Card withBorder>
          <Card.Section p="md">
            <Group justify="space-between">
              <Title order={4}>Экспорт результатов соревнования</Title>
              <Tooltip label="Экспортировать результаты конкретного соревнования">
                <ActionIcon variant="subtle" color="blue">
                  <IconInfoCircle size={16} />
                </ActionIcon>
              </Tooltip>
            </Group>
          </Card.Section>
          <Card.Section p="md" pt={0}>
            <Stack gap="md">
              <Select
                label="Выберите соревнование"
                placeholder="Выберите соревнование для экспорта"
                value={competitionExport.competitionId}
                onChange={(value) => setCompetitionExport(prev => ({ 
                  ...prev, 
                  competitionId: value || '' 
                }))}
                data={(upcomingCompetitions || []).map(competition => ({
                  value: competition.id,
                  label: competition.title
                }))}
                searchable
              />
              
              <Group>
                <Checkbox
                  label="Включить детали по видам рыбы"
                  checked={competitionExport.includeFishDetails}
                  onChange={(event) => setCompetitionExport(prev => ({ 
                    ...prev, 
                    includeFishDetails: event.currentTarget.checked 
                  }))}
                />
                <Checkbox
                  label="Включить детали по зонам"
                  checked={competitionExport.includeZoneDetails}
                  onChange={(event) => setCompetitionExport(prev => ({ 
                    ...prev, 
                    includeZoneDetails: event.currentTarget.checked 
                  }))}
                />
              </Group>

              <Button
                leftSection={<IconDownload size={16} />}
                onClick={handleCompetitionExport}
                disabled={!competitionExport.competitionId || isLoading}
                loading={isLoading}
              >
                Экспортировать результаты соревнования
              </Button>
            </Stack>
          </Card.Section>
        </Card>

        {/* Экспорт статистики пользователя */}
        <Card withBorder>
          <Card.Section p="md">
            <Group justify="space-between">
              <Title order={4}>Экспорт моей статистики</Title>
              <Tooltip label="Экспортировать персональную статистику и достижения">
                <ActionIcon variant="subtle" color="blue">
                  <IconInfoCircle size={16} />
                </ActionIcon>
              </Tooltip>
            </Group>
          </Card.Section>
          <Card.Section p="md" pt={0}>
            <Stack gap="md">
              <Group>
                <Checkbox
                  label="Включить достижения"
                  checked={userStatsExport.includeAchievements}
                  onChange={(event) => setUserStatsExport(prev => ({ 
                    ...prev, 
                    includeAchievements: event.currentTarget.checked 
                  }))}
                />
                <Checkbox
                  label="Включить награды"
                  checked={userStatsExport.includeRewards}
                  onChange={(event) => setUserStatsExport(prev => ({ 
                    ...prev, 
                    includeRewards: event.currentTarget.checked 
                  }))}
                />
                <Checkbox
                  label="Включить данные тренировок"
                  checked={userStatsExport.includeTrainingData}
                  onChange={(event) => setUserStatsExport(prev => ({ 
                    ...prev, 
                    includeTrainingData: event.currentTarget.checked 
                  }))}
                />
              </Group>

              <Button
                leftSection={<IconDownload size={16} />}
                onClick={handleUserStatsExport}
                disabled={!user?.id || isLoading}
                loading={isLoading}
              >
                Экспортировать мою статистику
              </Button>
            </Stack>
          </Card.Section>
        </Card>

        {/* Экспорт достижений */}
        <Card withBorder>
          <Card.Section p="md">
            <Group justify="space-between">
              <Title order={4}>Экспорт достижений</Title>
              <Tooltip label="Экспортировать все достижения или только ваши">
                <ActionIcon variant="subtle" color="blue">
                  <IconInfoCircle size={16} />
                </ActionIcon>
              </Tooltip>
            </Group>
          </Card.Section>
          <Card.Section p="md" pt={0}>
            <Stack gap="md">
              <Checkbox
                label="Включить прогресс выполнения"
                checked={achievementsExport.includeProgress}
                onChange={(event) => setAchievementsExport(prev => ({ 
                  ...prev, 
                  includeProgress: event.currentTarget.checked 
                }))}
              />

              <Button
                leftSection={<IconDownload size={16} />}
                onClick={handleAchievementsExport}
                disabled={isLoading}
                loading={isLoading}
              >
                Экспортировать достижения
              </Button>
            </Stack>
          </Card.Section>
        </Card>

        {/* Информация о форматах */}
        <Alert icon={<IconInfoCircle size={16} />} title="Информация о форматах" color="blue">
          <Stack gap="xs">
            <Text size="sm">
              <strong>CSV</strong> - совместим с Excel, Google Sheets и другими табличными редакторами
            </Text>
            <Text size="sm">
              <strong>Excel (.xlsx)</strong> - нативный формат Microsoft Excel с форматированием
            </Text>
            <Text size="sm">
              <strong>PDF</strong> - готовый к печати документ с таблицами и графиками
            </Text>
            <Text size="sm">
              <strong>JSON</strong> - структурированные данные для программной обработки
            </Text>
          </Stack>
        </Alert>
      </Stack>
    </Container>
  )
}
