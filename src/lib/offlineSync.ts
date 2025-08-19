import { getQueue, removeFromQueue } from './offlineQueue'
import { supabase } from './supabaseClient'
import { createResult } from '../features/results/api'

async function uploadProof(competitionId: string, dataUrl?: string | null): Promise<string | null> {
  if (!dataUrl) return null
  try {
    const res = await fetch(dataUrl)
    const blob = await res.blob()
    const fileName = `proof_${Date.now()}_${Math.random().toString(36).slice(2)}.jpg`
    const path = `${competitionId}/proofs/${fileName}`
    const { error } = await (supabase as any).storage.from('proofs').upload(path, blob, { upsert: true })
    if (error) throw error
    return path
  } catch {
    return null
  }
}

export async function syncOfflineQueue(createdBy?: string) {
  const items = await getQueue()
  for (const it of items) {
    try {
      if (it.type === 'create_result') {
        const payload = it.payload || {}
        const proofPath = await uploadProof(payload.competition_id, payload.proof_data_url)
        await createResult({
          competition_id: payload.competition_id,
          participant_user_id: payload.participant_user_id,
          fish_kind_id: payload.fish_kind_id,
          weight_grams: payload.weight_grams ?? null,
          length_cm: payload.length_cm ?? null,
          proof_path: proofPath ?? undefined,
        } as any, createdBy || 'offline-sync')
      }
      if (it.id) await removeFromQueue(it.id)
    } catch (e) {
      // stop on first failing item to retry later
      break
    }
  }
}


