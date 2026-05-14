package com.amigojolive.ui.admin

import cafe.adriel.voyager.core.model.ScreenModel
import cafe.adriel.voyager.core.model.screenModelScope
import com.amigojolive.core.network.ApiResult
import com.amigojolive.domain.model.AdminUser
import com.amigojolive.domain.model.Category
import com.amigojolive.domain.model.RegistrationRequest
import com.amigojolive.domain.repository.AdminRepository
import com.amigojolive.domain.repository.CategoryRepository
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch

data class AdminState(
    val loading: Boolean = false,
    val users: List<AdminUser> = emptyList(),
    val requests: List<RegistrationRequest> = emptyList(),
    val categories: List<Category> = emptyList(),
    val error: String? = null,
    val successMessage: String? = null,
)

class AdminViewModel(
    private val adminRepo: AdminRepository,
    private val catRepo: CategoryRepository,
) : ScreenModel {

    private val _state = MutableStateFlow(AdminState())
    val state: StateFlow<AdminState> = _state.asStateFlow()

    fun loadUsers() {
        screenModelScope.launch {
            _state.update { it.copy(loading = true) }
            when (val r = adminRepo.getUsers()) {
                is ApiResult.Success -> _state.update { it.copy(loading = false, users = r.data) }
                is ApiResult.Error   -> _state.update { it.copy(loading = false, error = r.message) }
            }
        }
    }

    fun toggleUserActive(userId: Int, currentStatus: String) {
        val nextStatus = if (currentStatus == "ACTIVO") "INACTIVO" else "ACTIVO"
        screenModelScope.launch {
            when (val r = adminRepo.updateUserStatus(userId, nextStatus)) {
                is ApiResult.Success -> {
                    _state.update { state ->
                        state.copy(
                            users = state.users.map {
                                if (it.id == userId) r.data else it
                            },
                            successMessage = if (nextStatus == "ACTIVO") "Usuario activado" else "Usuario desactivado",
                        )
                    }
                }
                is ApiResult.Error -> _state.update { it.copy(error = r.message) }
            }
        }
    }

    fun loadRequests() {
        screenModelScope.launch {
            _state.update { it.copy(loading = true) }
            when (val r = adminRepo.getRegistrationRequests()) {
                is ApiResult.Success -> _state.update { it.copy(loading = false, requests = r.data) }
                is ApiResult.Error   -> _state.update { it.copy(loading = false, error = r.message) }
            }
        }
    }

    fun approveRequest(id: Int) {
        screenModelScope.launch {
            when (val r = adminRepo.approve(id)) {
                is ApiResult.Success -> {
                    _state.update { state ->
                        state.copy(
                            requests = state.requests.filter { it.id != id },
                            successMessage = "Solicitud aprobada",
                        )
                    }
                }
                is ApiResult.Error -> _state.update { it.copy(error = r.message) }
            }
        }
    }

    fun rejectRequest(id: Int) {
        screenModelScope.launch {
            when (val r = adminRepo.reject(id)) {
                is ApiResult.Success -> {
                    _state.update { state ->
                        state.copy(
                            requests = state.requests.filter { it.id != id },
                            successMessage = "Solicitud rechazada",
                        )
                    }
                }
                is ApiResult.Error -> _state.update { it.copy(error = r.message) }
            }
        }
    }

    fun loadCategories() {
        screenModelScope.launch {
            _state.update { it.copy(loading = true) }
            when (val r = catRepo.getAll()) {
                is ApiResult.Success -> _state.update { it.copy(loading = false, categories = r.data) }
                is ApiResult.Error   -> _state.update { it.copy(loading = false, error = r.message) }
            }
        }
    }

    fun createCategory(name: String) {
        if (name.isBlank()) return
        screenModelScope.launch {
            when (val r = catRepo.create(name.trim())) {
                is ApiResult.Success -> {
                    _state.update { state ->
                        state.copy(categories = state.categories + r.data, successMessage = "Categoría creada")
                    }
                }
                is ApiResult.Error -> _state.update { it.copy(error = r.message) }
            }
        }
    }

    fun updateCategory(id: Int, name: String) {
        if (name.isBlank()) return
        screenModelScope.launch {
            when (val r = catRepo.update(id, name.trim())) {
                is ApiResult.Success -> {
                    _state.update { state ->
                        state.copy(
                            categories = state.categories.map { if (it.id == id) r.data else it },
                            successMessage = "Categoría actualizada",
                        )
                    }
                }
                is ApiResult.Error -> _state.update { it.copy(error = r.message) }
            }
        }
    }

    fun deleteCategory(id: Int) {
        screenModelScope.launch {
            when (val r = catRepo.delete(id)) {
                is ApiResult.Success -> {
                    _state.update { state ->
                        state.copy(
                            categories = state.categories.filter { it.id != id },
                            successMessage = "Categoría eliminada",
                        )
                    }
                }
                is ApiResult.Error -> _state.update { it.copy(error = r.message) }
            }
        }
    }

    fun clearMessages() = _state.update { it.copy(error = null, successMessage = null) }
}
