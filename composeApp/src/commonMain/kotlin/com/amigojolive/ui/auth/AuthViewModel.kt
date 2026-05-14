package com.amigojolive.ui.auth

import cafe.adriel.voyager.core.model.ScreenModel
import cafe.adriel.voyager.core.model.screenModelScope
import com.amigojolive.core.network.ApiResult
import com.amigojolive.core.session.SessionStore
import com.amigojolive.domain.model.UserSummary
import com.amigojolive.domain.repository.AuthRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class AuthState(
    val loading: Boolean = false,
    val error: String? = null,
    val navigateTo: NavigationTarget? = null,
)

enum class NavigationTarget { TEACHER_HOME, ADMIN_HOME, ACCESS_DENIED, REGISTER_SUCCESS }

class AuthViewModel(private val repo: AuthRepository) : ScreenModel {

    private val _state = MutableStateFlow(AuthState())
    val state: StateFlow<AuthState> = _state.asStateFlow()

    init { hydrateSession() }

    private fun hydrateSession() {
        if (!repo.isLoggedIn()) return
        screenModelScope.launch {
            _state.update { it.copy(loading = true) }
            when (val result = repo.getMe()) {
                is ApiResult.Success -> {
                    SessionStore.setUser(result.data)
                    _state.update {
                        it.copy(loading = false, navigateTo = result.data.targetScreen())
                    }
                }
                is ApiResult.Error -> {
                    repo.logout()
                    SessionStore.clear()
                    _state.update { it.copy(loading = false) }
                }
            }
        }
    }

    fun login(institutionalEmail: String, password: String) {
        if (institutionalEmail.isBlank() || password.isBlank()) {
            _state.update { it.copy(error = "Por favor, completa todos los campos.") }
            return
        }
        screenModelScope.launch {
            _state.update { it.copy(loading = true, error = null) }
            when (val result = repo.login(institutionalEmail.trim(), password)) {
                is ApiResult.Success -> {
                    SessionStore.setUser(result.data)
                    _state.update {
                        it.copy(loading = false, navigateTo = result.data.targetScreen())
                    }
                }
                is ApiResult.Error -> _state.update {
                    it.copy(loading = false, error = result.message)
                }
            }
        }
    }

    fun registerRequest(
        institutionalEmail: String,
        password: String,
        firstName: String,
        lastName: String,
        area: String,
        description: String,
    ) {
        screenModelScope.launch {
            _state.update { it.copy(loading = true, error = null) }
            when (
                val r = repo.registerRequest(
                    institutionalEmail = institutionalEmail.trim(),
                    password = password,
                    firstName = firstName.trim(),
                    lastName = lastName.trim(),
                    area = area.trim().takeIf { it.isNotBlank() },
                    description = description.trim().takeIf { it.isNotBlank() },
                )
            ) {
                is ApiResult.Success -> _state.update {
                    it.copy(loading = false, navigateTo = NavigationTarget.REGISTER_SUCCESS)
                }
                is ApiResult.Error -> _state.update {
                    it.copy(loading = false, error = r.message)
                }
            }
        }
    }

    fun logout() {
        repo.logout()
        SessionStore.clear()
        _state.update { AuthState() }
    }

    fun clearNavigationTarget() = _state.update { it.copy(navigateTo = null) }
    fun clearError()            = _state.update { it.copy(error = null) }

    private fun UserSummary.targetScreen() =
        when (role) {
            "admin" -> NavigationTarget.ADMIN_HOME
            "docente" -> NavigationTarget.TEACHER_HOME
            else -> NavigationTarget.ACCESS_DENIED
        }
}
