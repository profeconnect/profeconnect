package com.amigojolive.core.socket

import com.amigojolive.domain.model.ChatMessageRequest

/**
 * Contrato KMP para el chatbot en tiempo real.
 *
 * Android (actual en androidMain): envuelve socket.io-client Java oficial.
 * Web    (actual en jsMain):       bridge al NPM socket.io-client via @JsModule.
 *
 * El namespace del backend es /chatbot (server.js + chatbot.socket.js).
 * Auth: handshake con { auth: { token } } — misma forma que socket.ts del legado React.
 *
 * Eventos escuchados del servidor:
 *   chat:token  → fragmento de respuesta (streaming)
 *   chat:done   → respuesta completa
 *   chat:error  → error del asistente
 *
 * Evento emitido al servidor:
 *   chat:stream → { messages: [{ role, content }] }
 */
expect class ChatSocketService(
    serverUrl: String,
    tokenProvider: () -> String?,
) {
    fun connect()
    fun disconnect()
    fun sendMessage(history: List<ChatMessageRequest>)
    fun onToken(callback: (String) -> Unit)
    fun onDone(callback: () -> Unit)
    fun onError(callback: (String) -> Unit)
}
