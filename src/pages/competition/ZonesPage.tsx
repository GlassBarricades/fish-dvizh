import { useParams } from 'react-router-dom'
import { useAuth } from '@/features/auth/hooks'
import { useCompetition } from '@/features/competitions/hooks'
import { ZonesTab } from '@/features/zones/ZonesTab'

export default function ZonesPage() {
  const { competitionId } = useParams()
  const { user } = useAuth()
  const { data: competition } = useCompetition(competitionId!)

  const canEdit = !!(
    user?.id && (
      user.id === competition?.created_by || 
      (user as any)?.user_metadata?.role === 'admin'
    )
  )

  return (
    <ZonesTab competitionId={competitionId!} canEdit={canEdit} active={true} />
  )
}
