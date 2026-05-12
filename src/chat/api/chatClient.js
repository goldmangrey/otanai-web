export async function sendChatRequest({
    apiBaseUrl,
    chatId,
    message,
    messages,
    requestId,
    signal,
    token
}) {
    const normalizedBaseUrl = apiBaseUrl?.replace(/\/$/, '')

    if (!normalizedBaseUrl) {
        throw new Error('Missing VITE_API_BASE_URL for chat backend.')
    }

    const response = await fetch(`${normalizedBaseUrl}/chat`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
            chatId,
            message,
            requestId,
            messages
        }),
        signal
    })

    let data = null
    try {
        data = await response.json()
    } catch {
        data = null
    }

    if (!response.ok) {
        throw new Error(data?.error || data?.message || 'The assistant request failed.')
    }

    const metadata = data?.metadata || null
    const assistantText = data?.assistantText || data?.text || data?.message
    if (metadata?.rerouteToLegalResearch === true) {
        return {
            assistantText: typeof assistantText === 'string' ? assistantText : '',
            metadata
        }
    }

    if (!assistantText || typeof assistantText !== 'string') {
        throw new Error('Backend returned an invalid assistant response.')
    }

    return {
        assistantText,
        metadata
    }
}
