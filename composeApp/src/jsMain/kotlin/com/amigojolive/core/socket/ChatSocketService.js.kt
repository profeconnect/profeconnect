package com.amigojolive.core.socket

import com.amigojolive.domain.model.ChatMessageRequest

/**
 * Implementación JS del ChatSocketService.
 *
 * Usa la librería NPM socket.io-client via las declaraciones external en
 * SocketIODeclarations.kt. No se escribe ninguna lógica de protocolo aquí:
 * la capa `external` delega todo al bundle NPM y Webpack lo resuelve.
 *
 * Namespace: /chatbot — igual que el target Android y el legado React.
 */
actual class ChatSocketService actual constructor(
    private val serverUrl: String,
    private val tokenProvider: () -> String?,
) {
    private var rawSocket: RawSocket? = null
    private var tokenCallback: ((String) -> Unit)? = null
    private var doneCallback:  (() -> Unit)?       = null
    private var errorCallback: ((String) -> Unit)? = null

    actual fun connect() {
        if (rawSocket != null) return

        val opts: dynamic = js("({})")
        opts.auth = js("({})")
        opts.auth.token = tokenProvider() ?: ""
        opts.transports = arrayOf("websocket", "polling")

        rawSocket = socketIO("$serverUrl/chatbot", opts).also { socket ->
            socket.on("chat:token") { data ->
                val token = data?.token?.unsafeCast<String>() ?: return@on
                tokenCallback?.invoke(token)
            }
            socket.on("chat:done") { _ ->
                doneCallback?.invoke()
            }
            socket.on("chat:error") { data ->
                val msg: String = data?.message?.unsafeCast<String>() ?: "Error del asistente"
                errorCallback?.invoke(msg)
            }
            socket.connect()
        }
    }

    actual fun disconnect() {
        rawSocket?.off("chat:token")
        rawSocket?.off("chat:done")
        rawSocket?.off("chat:error")
        rawSocket?.disconnect()
        rawSocket = null
    }

    actual fun sendMessage(history: List<ChatMessageRequest>) {
        val payload: dynamic = js("({})")
        payload.messages = history.map { msg ->
            val jsMsg: dynamic = js("({})")
            jsMsg.role    = msg.role
            jsMsg.content = msg.content
            jsMsg
        }.toTypedArray()
        rawSocket?.emit("chat:stream", payload)
    }

    actual fun onToken(callback: (String) -> Unit) { tokenCallback = callback }
    actual fun onDone(callback: () -> Unit)         { doneCallback  = callback }
    actual fun onError(callback: (String) -> Unit)  { errorCallback = callback }
}
