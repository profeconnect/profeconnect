package com.amigojolive.core.socket

import com.amigojolive.domain.model.ChatMessageRequest
import io.socket.client.IO
import io.socket.client.Socket
import org.json.JSONArray
import org.json.JSONObject

/**
 * Implementación Android del ChatSocketService.
 * Usa el cliente Java oficial de Socket.IO (io.socket:socket.io-client).
 *
 * Auth en handshake: { auth: { token } }  ← misma forma que socket.ts React.
 * Namespace: /chatbot
 */
actual class ChatSocketService actual constructor(
    private val serverUrl: String,
    private val tokenProvider: () -> String?,
) {
    private var socket: Socket? = null
    private var tokenCallback: ((String) -> Unit)? = null
    private var doneCallback:  (() -> Unit)?       = null
    private var errorCallback: ((String) -> Unit)? = null

    actual fun connect() {
        if (socket != null) return

        socket?.off()
        socket?.disconnect()

        val opts = IO.Options.builder()
            .setAuth(mapOf("token" to (tokenProvider() ?: "")))
            .setTransports(arrayOf("websocket", "polling"))
            .build()

        socket = IO.socket("$serverUrl/chatbot", opts).apply {
            on("chat:token") { args ->
                val raw = args.firstOrNull()
                val token = when (raw) {
                    is JSONObject -> raw.optString("token")
                    else -> raw?.toString().orEmpty()
                }
                if (token.isBlank()) return@on
                tokenCallback?.invoke(token)
            }
            on("chat:done") { _ ->
                doneCallback?.invoke()
            }
            on("chat:error") { args ->
                val msg = (args.firstOrNull() as? JSONObject)
                    ?.optString("message") ?: "Error del asistente"
                errorCallback?.invoke(msg)
            }
            connect()
        }
    }

    actual fun disconnect() {
        socket?.off()
        socket?.disconnect()
        socket = null
    }

    actual fun sendMessage(history: List<ChatMessageRequest>) {
        val historyArray = JSONArray().apply {
            history.forEach { msg ->
                put(JSONObject().apply {
                    put("role", msg.role)
                    put("content", msg.content)
                })
            }
        }
        val payload = JSONObject().apply { put("messages", historyArray) }
        socket?.emit("chat:stream", payload)
    }

    actual fun onToken(callback: (String) -> Unit) { tokenCallback = callback }
    actual fun onDone(callback: () -> Unit)         { doneCallback  = callback }
    actual fun onError(callback: (String) -> Unit)  { errorCallback = callback }
}
