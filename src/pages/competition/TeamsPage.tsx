import { useParams } from 'react-router-dom'
import { useAuth } from '@/features/auth/hooks'
import { TeamsTab } from '@/features/teams/TeamsTab'

export default function TeamsPage() {
  const { competitionId } = useParams()
  const { user } = useAuth()

  return (
    <TeamsTab competitionId={competitionId!} userId={user?.id} />
  )
}
