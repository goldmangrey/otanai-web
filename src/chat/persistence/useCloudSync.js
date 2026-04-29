import { useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from '../../auth/useAuth.js'
import {
  isCloudPersistenceConfigured,
  listRemoteChats,
  syncRemoteChats
} from './cloudPersistenceAdapter.js'
import { mergeChats } from './mergeChats.js'
import { createSyncQueuePayload } from './syncQueue.js'
import { CLOUD_SYNC_MODE, CLOUD_SYNC_STATUS } from './persistenceTypes.js'

export function useCloudSync({
  activeChatId,
  chats,
  deletedChatIds,
  replaceChatState,
  clearDeletedChatIds,
  markChatsSynced
}) {
  const { currentUser, isAuthenticated } = useAuth()
  const [syncStatus, setSyncStatus] = useState(CLOUD_SYNC_STATUS.DISABLED)
  const [syncError, setSyncError] = useState('')
  const restoredScopeRef = useRef('')
  const syncConfigured = useMemo(() => isCloudPersistenceConfigured(), [])
  const syncMode =
    isAuthenticated && syncConfigured ? CLOUD_SYNC_MODE.REMOTE_READY : CLOUD_SYNC_MODE.LOCAL_ONLY

  useEffect(() => {
    if (!isAuthenticated || !syncConfigured || !currentUser) {
      restoredScopeRef.current = ''
      const timeoutId = window.setTimeout(() => {
        setSyncStatus(CLOUD_SYNC_STATUS.DISABLED)
        setSyncError('')
      }, 0)

      return () => {
        window.clearTimeout(timeoutId)
      }
    }

    if (restoredScopeRef.current === currentUser.uid) {
      return
    }

    const restoreScope = currentUser.uid

    let cancelled = false

    const restoreRemoteChats = async () => {
      try {
        setSyncStatus(CLOUD_SYNC_STATUS.SYNCING)
        const token = await currentUser.getIdToken()
        const remoteState = await listRemoteChats({ token })
        if (cancelled) return

        const mergedChats = mergeChats(chats, remoteState.chats)
        replaceChatState({
          activeChatId,
          chats: mergedChats,
          deletedChatIds
        })
        restoredScopeRef.current = restoreScope
        setSyncStatus(CLOUD_SYNC_STATUS.IDLE)
        setSyncError('')
      } catch (error) {
        if (cancelled) return
        setSyncStatus(CLOUD_SYNC_STATUS.ERROR)
        setSyncError(error instanceof Error ? error.message : 'Cloud restore failed.')
      }
    }

    restoreRemoteChats()

    return () => {
      cancelled = true
    }
  }, [activeChatId, chats, currentUser, deletedChatIds, isAuthenticated, replaceChatState, syncConfigured])

  useEffect(() => {
    if (!isAuthenticated || !syncConfigured || !currentUser) return

    const { chats: dirtyChats, deletedChatIds: pendingDeletedChatIds } = createSyncQueuePayload({
      chats,
      deletedChatIds
    })

    if (!dirtyChats.length && !pendingDeletedChatIds.length) {
      const timeoutId = window.setTimeout(() => {
        setSyncStatus(CLOUD_SYNC_STATUS.IDLE)
      }, 0)

      return () => {
        window.clearTimeout(timeoutId)
      }
    }

    let cancelled = false

    const timeoutId = window.setTimeout(async () => {
      try {
        setSyncStatus(CLOUD_SYNC_STATUS.SYNCING)
        const token = await currentUser.getIdToken()
        const response = await syncRemoteChats({
          chats: dirtyChats,
          deletedChatIds: pendingDeletedChatIds,
          token
        })

        if (cancelled) return

        markChatsSynced(dirtyChats.map((chat) => chat.id))
        clearDeletedChatIds(response.deletedChatIds.length ? response.deletedChatIds : pendingDeletedChatIds)
        setSyncStatus(CLOUD_SYNC_STATUS.IDLE)
        setSyncError('')
      } catch (error) {
        if (cancelled) return
        setSyncStatus(CLOUD_SYNC_STATUS.ERROR)
        setSyncError(error instanceof Error ? error.message : 'Cloud sync failed.')
      }
    }, 600)

    return () => {
      cancelled = true
      window.clearTimeout(timeoutId)
    }
  }, [
    chats,
    clearDeletedChatIds,
    currentUser,
    deletedChatIds,
    isAuthenticated,
    markChatsSynced,
    syncConfigured
  ])

  return {
    syncConfigured,
    syncError,
    syncMode,
    syncStatus
  }
}
