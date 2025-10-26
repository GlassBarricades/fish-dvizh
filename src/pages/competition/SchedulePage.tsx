import { useParams } from 'react-router-dom'
import { ScheduleTab } from '@/features/schedule/ScheduleTab'

export default function SchedulePage() {
  const { competitionId } = useParams()

  return (
    <ScheduleTab competitionId={competitionId!} />
  )
}
