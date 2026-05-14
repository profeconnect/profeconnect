package com.amigojolive.domain.model

import kotlinx.serialization.Serializable

/**
 * Mensaje que se envía al socket en el evento `chat:stream`.
 * El servidor espera { messages: [{ role, content }] }
 */
@Serializable
data class ChatMessageRequest(
    val role: String,    // "user" | "assistant"
    val content: String,
)

/** Mensaje local (UI) para la pantalla del chatbot. */
data class ChatMessage(
    val id: String,
    val role: String,
    val content: String,
    val isStreaming: Boolean = false,
)
