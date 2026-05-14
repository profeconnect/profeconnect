package com.amigojolive.ui.chatbot

import cafe.adriel.voyager.core.model.ScreenModel
import cafe.adriel.voyager.core.model.screenModelScope
import com.amigojolive.core.socket.ChatSocketService
import com.amigojolive.domain.model.ChatMessage
import com.amigojolive.domain.model.ChatMessageRequest
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import kotlin.uuid.ExperimentalUuidApi
import kotlin.uuid.Uuid

data class ChatbotState(
    val messages: List<ChatMessage> = emptyList(),
    val connected: Boolean = false,
    val streaming: Boolean = false,
    val error: String? = null,
)

@OptIn(ExperimentalUuidApi::class)
class ChatbotViewModel(private val socketService: ChatSocketService) : ScreenModel {

    private val _state = MutableStateFlow(ChatbotState())
    val state: StateFlow<ChatbotState> = _state.asStateFlow()
    private var hasConnected = false

    init {
        socketService.onToken { token ->
            _state.update { state ->
                val messages = state.messages.toMutableList()
                val last = messages.lastOrNull()
                if (last != null && last.isStreaming) {
                    messages[messages.lastIndex] = last.copy(content = last.content + token)
                    state.copy(messages = messages)
                } else {
                    val newMsg = ChatMessage(
                        id = Uuid.random().toString(),
                        role = "assistant",
                        content = token,
                        isStreaming = true,
                    )
                    state.copy(messages = messages + newMsg, streaming = true)
                }
            }
        }

        socketService.onDone {
            _state.update { state ->
                val messages = state.messages.toMutableList()
                val last = messages.lastOrNull()
                if (last != null && last.isStreaming) {
                    messages[messages.lastIndex] = last.copy(isStreaming = false)
                }
                state.copy(messages = messages, streaming = false)
            }
        }

        socketService.onError { error ->
            _state.update { it.copy(streaming = false, error = error) }
        }

        connect()
    }

    fun connect() {
        if (hasConnected) return
        screenModelScope.launch {
            socketService.connect()
            hasConnected = true
            _state.update { it.copy(connected = true) }
        }
    }

    fun sendMessage(text: String) {
        if (text.isBlank() || _state.value.streaming) return
        if (!hasConnected) connect()

        val userMsg = ChatMessage(
            id      = Uuid.random().toString(),
            role    = "user",
            content = text.trim(),
        )
        _state.update { it.copy(messages = it.messages + userMsg, error = null) }

        val history = _state.value.messages
            .filter { !it.isStreaming }
            .map { ChatMessageRequest(role = it.role, content = it.content) }

        socketService.sendMessage(history)
    }

    fun clearError() = _state.update { it.copy(error = null) }

    override fun onDispose() {
        hasConnected = false
        socketService.disconnect()
        super.onDispose()
    }
}
