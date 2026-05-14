package com.amigojolive.ui.profile

import cafe.adriel.voyager.core.model.ScreenModel
import cafe.adriel.voyager.core.model.screenModelScope
import com.amigojolive.core.network.ApiResult
import com.amigojolive.core.network.ApiService
import com.amigojolive.domain.model.ProfileResponse
import com.amigojolive.domain.model.UpdateProfileRequest
import com.amigojolive.domain.model.UserSummary
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch

data class ProfileState(
    val loading: Boolean = false,
    val profile: ProfileResponse? = null,
    val currentUser: UserSummary? = null,
    val error: String? = null,
    val successMessage: String? = null,
)

class ProfileViewModel(
    private val apiService: ApiService,
    private val currentUser: UserSummary,
) : ScreenModel {

    private val _state = MutableStateFlow(ProfileState(currentUser = currentUser))
    val state: StateFlow<ProfileState> = _state.asStateFlow()

    init { loadProfile() }

    fun loadProfile() {
        screenModelScope.launch {
            _state.update { it.copy(loading = true, error = null) }
            when (val r = apiService.getProfile()) {
                is ApiResult.Success -> _state.update { it.copy(loading = false, profile = r.data) }
                is ApiResult.Error   -> _state.update { it.copy(loading = false, error = r.message) }
            }
        }
    }

    fun update(fullName: String, area: String, description: String) {
        val parts = fullName.trim().split("\\s+".toRegex()).filter { it.isNotBlank() }
        val firstName = parts.firstOrNull()
        val lastName = parts.drop(1).joinToString(" ").ifBlank { null }
        screenModelScope.launch {
            _state.update { it.copy(loading = true) }
            val request = UpdateProfileRequest(
                firstName = firstName,
                lastName = lastName,
                area        = area.trim().takeIf { it.isNotBlank() },
                description = description.trim().takeIf { it.isNotBlank() },
            )
            when (val r = apiService.updateProfile(request)) {
                is ApiResult.Success -> _state.update {
                    it.copy(loading = false, profile = r.data, successMessage = "Perfil actualizado")
                }
                is ApiResult.Error -> _state.update { it.copy(loading = false, error = r.message) }
            }
        }
    }

    fun clearMessages() = _state.update { it.copy(error = null, successMessage = null) }
}
