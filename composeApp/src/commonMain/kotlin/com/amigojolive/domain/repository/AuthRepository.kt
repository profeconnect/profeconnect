package com.amigojolive.domain.repository

import com.amigojolive.core.network.ApiResult
import com.amigojolive.core.network.ApiService
import com.amigojolive.core.session.TokenStorage
import com.amigojolive.domain.model.*

class AuthRepository(
    private val apiService: ApiService,
    private val tokenStorage: TokenStorage,
) {
    suspend fun login(institutionalEmail: String, password: String): ApiResult<UserSummary> {
        val result = apiService.login(LoginRequest(institutionalEmail, password))
        if (result is ApiResult.Success) {
            tokenStorage.saveToken(result.data.token)
            return ApiResult.Success(result.data.user)
        }
        return result as ApiResult.Error
    }

    suspend fun registerRequest(
        institutionalEmail: String,
        password: String,
        firstName: String,
        lastName: String,
        area: String?,
        description: String?,
    ): ApiResult<RegistrationRequest> =
        apiService.registerRequest(
            RegisterRequest(
                institutionalEmail = institutionalEmail,
                password = password,
                firstName = firstName,
                lastName = lastName,
                area = area,
                description = description,
            )
        )

    suspend fun getMe(): ApiResult<UserSummary> = apiService.getMe()

    fun logout() = tokenStorage.clearToken()

    fun isLoggedIn(): Boolean = tokenStorage.getToken() != null
}
