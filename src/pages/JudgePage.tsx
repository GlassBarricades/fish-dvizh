import { useParams } from 'react-router-dom'
import { useJudgePanel } from '@/features/judging/model/hooks'
import { JudgePanel } from '@/features/judging/ui/JudgePanel'

export default function JudgePage() {
  const { competitionId } = useParams()
  const vm = useJudgePanel(competitionId)
  return <JudgePanel vm={vm} />
}


