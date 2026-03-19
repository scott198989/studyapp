import { useEffect, useState } from 'react'

import { defaultAppState, loadAppState, saveAppState } from '../lib/storage'
import type { PersistedAppState } from '../types/study'

export function usePersistentAppState() {
  const [state, setState] = useState<PersistedAppState>(() => loadAppState())

  useEffect(() => {
    saveAppState(state)
  }, [state])

  return [state, setState] as const
}

export function resetAppState() {
  return defaultAppState
}
