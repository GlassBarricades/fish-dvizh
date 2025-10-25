// Компонент для загрузки CSV файла с участниками
// Создайте файл src/components/CsvUploader.tsx

import { useState, useRef } from 'react'
import {
  Paper,
  Stack,
  Text,
  Button,
  Group,
  Alert,
  Table,
  Badge,
  Progress,
  FileInput,
  Divider,
  Title,
  Box
} from '@mantine/core'
import {
  IconUpload,
  IconFileText,
  IconCheck,
  IconX,
  IconAlertCircle,
  IconDownload
} from '@tabler/icons-react'
import { notifications } from '@mantine/notifications'

interface CsvRow {
  email: string
  name?: string
  class?: string
}

interface CsvUploaderProps {
  onUpload: (data: CsvRow[]) => Promise<void>
  isLoading?: boolean
  templateUrl?: string
}

export function CsvUploader({ onUpload, isLoading = false, templateUrl }: CsvUploaderProps) {
  const [csvData, setCsvData] = useState<CsvRow[]>([])
  const [errors, setErrors] = useState<string[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const parseCsv = (csvText: string): CsvRow[] => {
    const lines = csvText.split('\n').filter(line => line.trim())
    const rows: CsvRow[] = []
    const errors: string[] = []

    // Пропускаем заголовок, если он есть
    const startIndex = lines[0]?.toLowerCase().includes('email') ? 1 : 0

    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i].trim()
      if (!line) continue

      const columns = line.split(',').map(col => col.trim().replace(/"/g, ''))
      
      if (columns.length < 1) {
        errors.push(`Строка ${i + 1}: Недостаточно данных`)
        continue
      }

      const email = columns[0]
      if (!email) {
        errors.push(`Строка ${i + 1}: Email не указан`)
        continue
      }

      if (!validateEmail(email)) {
        errors.push(`Строка ${i + 1}: Некорректный email "${email}"`)
        continue
      }

      rows.push({
        email: email.toLowerCase(),
        name: columns[1] || undefined,
        class: columns[2] || 'open'
      })
    }

    setErrors(errors)
    return rows
  }

  const handleFileUpload = (file: File | null) => {
    if (!file) return

    if (!file.name.toLowerCase().endsWith('.csv')) {
      notifications.show({
        color: 'red',
        title: 'Ошибка',
        message: 'Пожалуйста, выберите CSV файл'
      })
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const csvText = e.target?.result as string
      const parsedData = parseCsv(csvText)
      setCsvData(parsedData)
    }
    reader.readAsText(file, 'UTF-8')
  }

  const handleUpload = async () => {
    if (csvData.length === 0) {
      notifications.show({
        color: 'red',
        title: 'Ошибка',
        message: 'Нет данных для загрузки'
      })
      return
    }

    if (errors.length > 0) {
      notifications.show({
        color: 'red',
        title: 'Ошибка',
        message: 'Исправьте ошибки в данных перед загрузкой'
      })
      return
    }

    setIsProcessing(true)
    try {
      await onUpload(csvData)
      setCsvData([])
      setErrors([])
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      notifications.show({
        color: 'green',
        title: 'Успех',
        message: `Успешно обработано ${csvData.length} участников`
      })
    } catch (error) {
      notifications.show({
        color: 'red',
        title: 'Ошибка',
        message: 'Произошла ошибка при загрузке данных'
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const downloadTemplate = () => {
    const template = 'email,name,class\nexample@email.com,Иван Иванов,open\nanother@email.com,Петр Петров,pro'
    const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', 'template.csv')
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <Paper withBorder p="md" radius="md">
      <Stack gap="md">
        <Title order={4}>Массовое добавление участников</Title>
        
        <Text size="sm" c="dimmed">
          Загрузите CSV файл с данными участников. Файл должен содержать колонки: email, name (опционально), class (опционально).
        </Text>

        <Group>
          <Button
            variant="light"
            leftSection={<IconDownload size={16} />}
            onClick={downloadTemplate}
          >
            Скачать шаблон
          </Button>
        </Group>

        <FileInput
          ref={fileInputRef}
          label="Выберите CSV файл"
          placeholder="Выберите файл..."
          accept=".csv"
          onChange={handleFileUpload}
          leftSection={<IconFileText size={16} />}
        />

        {errors.length > 0 && (
          <Alert
            icon={<IconAlertCircle size={16} />}
            title="Ошибки в данных"
            color="red"
          >
            <Stack gap="xs">
              {errors.map((error, index) => (
                <Text key={index} size="sm">{error}</Text>
              ))}
            </Stack>
          </Alert>
        )}

        {csvData.length > 0 && (
          <>
            <Divider />
            <Group justify="space-between">
              <Text fw={500}>Найдено участников: {csvData.length}</Text>
              <Badge color={errors.length > 0 ? 'red' : 'green'} variant="light">
                {errors.length > 0 ? `${errors.length} ошибок` : 'Данные корректны'}
              </Badge>
            </Group>

            <Box style={{ maxHeight: '300px', overflow: 'auto' }}>
              <Table striped highlightOnHover withTableBorder withColumnBorders>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Email</Table.Th>
                    <Table.Th>Имя</Table.Th>
                    <Table.Th>Класс</Table.Th>
                    <Table.Th>Статус</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {csvData.map((row, index) => {
                    const hasError = errors.some(error => error.includes(`Строка ${index + 1}`))
                    return (
                      <Table.Tr key={index}>
                        <Table.Td>{row.email}</Table.Td>
                        <Table.Td>{row.name || '-'}</Table.Td>
                        <Table.Td>{row.class}</Table.Td>
                        <Table.Td>
                          {hasError ? (
                            <Badge color="red" leftSection={<IconX size={12} />}>
                              Ошибка
                            </Badge>
                          ) : (
                            <Badge color="green" leftSection={<IconCheck size={12} />}>
                              OK
                            </Badge>
                          )}
                        </Table.Td>
                      </Table.Tr>
                    )
                  })}
                </Table.Tbody>
              </Table>
            </Box>

            <Group justify="flex-end">
              <Button
                onClick={handleUpload}
                loading={isProcessing || isLoading}
                disabled={errors.length > 0}
                leftSection={<IconUpload size={16} />}
              >
                Загрузить участников
              </Button>
            </Group>
          </>
        )}
      </Stack>
    </Paper>
  )
}
