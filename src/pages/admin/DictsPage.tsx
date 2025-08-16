import { Card, List, Text, Title } from '@mantine/core'
import { Link } from 'react-router-dom'

export default function AdminDictsPage() {
  return (
    <Card withBorder padding="lg" radius="md">
      <Title order={3} mb="sm">Справочники</Title>
      <Text c="dimmed" mb="md">Выберите справочник для управления данными.</Text>
      <List>
        <List.Item>
          <Link to="/admin/dicts/fish">Виды рыбы</Link>
        </List.Item>
        <List.Item>
          <Link to="/admin/dicts/formats">Форматы соревнований</Link>
        </List.Item>
        <List.Item>
          <Link to="/admin/dicts/team-sizes">Размеры команд</Link>
        </List.Item>
      </List>
    </Card>
  )
}



