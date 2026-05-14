package com.amigojolive.core.network

import com.amigojolive.domain.model.*
import io.ktor.client.HttpClient
import io.ktor.client.call.body
import io.ktor.client.request.*
import io.ktor.client.request.forms.formData
import io.ktor.client.request.forms.submitFormWithBinaryData
import io.ktor.http.*

/** Servicio de red: envuelve llamadas Ktor y desenvuelve ApiResponse. */
class ApiService(private val client: HttpClient) {

    // ─── Auth ──────────────────────────────────────────────────────────────

    suspend fun login(request: LoginRequest): ApiResult<AuthData> = safeCall {
        client.post("${NetworkConfig.apiBaseUrl}/auth/login") {
            contentType(ContentType.Application.Json)
            setBody(request)
        }.body<ApiResponse<AuthData>>().unwrap()
    }

    suspend fun registerRequest(request: RegisterRequest): ApiResult<RegistrationRequest> = safeCall {
        client.post("${NetworkConfig.apiBaseUrl}/auth/register-request") {
            contentType(ContentType.Application.Json)
            setBody(request)
        }.body<ApiResponse<RegistrationRequest>>().unwrap()
    }

    suspend fun getMe(): ApiResult<UserSummary> = safeCall {
        client.get("${NetworkConfig.apiBaseUrl}/auth/me")
            .body<ApiResponse<UserSummary>>()
            .unwrap()
    }

    // ─── Perfil ─────────────────────────────────────────────────────────────

    suspend fun getProfile(): ApiResult<ProfileResponse> = safeCall {
        client.get("${NetworkConfig.apiBaseUrl}/profiles/me")
            .body<ApiResponse<ProfileResponse>>()
            .unwrap()
    }

    suspend fun updateProfile(request: UpdateProfileRequest): ApiResult<ProfileResponse> = safeCall {
        client.patch("${NetworkConfig.apiBaseUrl}/profiles/me") {
            contentType(ContentType.Application.Json)
            setBody(request)
        }.body<ApiResponse<ProfileResponse>>().unwrap()
    }

    // ─── Publicaciones ───────────────────────────────────────────────────────

    suspend fun getPublications(): ApiResult<List<Publication>> = safeCall {
        client.get("${NetworkConfig.apiBaseUrl}/publications")
            .body<ApiResponse<List<Publication>>>()
            .unwrap()
    }

    suspend fun getPublication(id: Int): ApiResult<Publication> = safeCall {
        client.get("${NetworkConfig.apiBaseUrl}/publications/$id")
            .body<ApiResponse<Publication>>()
            .unwrap()
    }

    suspend fun createPublication(request: PublicationRequest): ApiResult<Publication> = safeCall {
        val response = client.submitFormWithBinaryData(
            url = "${NetworkConfig.apiBaseUrl}/publications",
            formData = buildFormData(request),
        ) { method = HttpMethod.Post }
        response.body<ApiResponse<Publication>>().unwrap()
    }

    suspend fun updatePublication(id: Int, request: PublicationRequest): ApiResult<Publication> = safeCall {
        val response = client.submitFormWithBinaryData(
            url = "${NetworkConfig.apiBaseUrl}/publications/$id",
            formData = buildFormData(request),
        ) { method = HttpMethod.Put }
        response.body<ApiResponse<Publication>>().unwrap()
    }

    suspend fun deletePublication(id: Int): ApiResult<Unit> = safeCall {
        client.delete("${NetworkConfig.apiBaseUrl}/publications/$id")
            .body<ApiResponse<Unit>>()
            .unwrap()
    }

    // ─── Categorías ──────────────────────────────────────────────────────────

    suspend fun getCategories(): ApiResult<List<Category>> = safeCall {
        client.get("${NetworkConfig.apiBaseUrl}/categories")
            .body<ApiResponse<List<Category>>>()
            .unwrap()
    }

    suspend fun createCategory(request: CategoryRequest): ApiResult<Category> = safeCall {
        client.post("${NetworkConfig.apiBaseUrl}/categories") {
            contentType(ContentType.Application.Json)
            setBody(request)
        }.body<ApiResponse<Category>>().unwrap()
    }

    suspend fun updateCategory(id: Int, request: CategoryRequest): ApiResult<Category> = safeCall {
        client.put("${NetworkConfig.apiBaseUrl}/categories/$id") {
            contentType(ContentType.Application.Json)
            setBody(request)
        }.body<ApiResponse<Category>>().unwrap()
    }

    suspend fun deleteCategory(id: Int): ApiResult<Unit> = safeCall {
        client.delete("${NetworkConfig.apiBaseUrl}/categories/$id")
        ApiResult.Success(Unit)
    }

    // ─── Admin usuarios ─────────────────────────────────────────────────────

    suspend fun getUsers(): ApiResult<List<AdminUser>> = safeCall {
        client.get("${NetworkConfig.apiBaseUrl}/admin/users")
            .body<ApiResponse<List<AdminUser>>>()
            .unwrap()
    }

    suspend fun updateUserStatus(userId: Int, status: String): ApiResult<AdminUser> = safeCall {
        client.patch("${NetworkConfig.apiBaseUrl}/admin/users/$userId/status") {
            contentType(ContentType.Application.Json)
            setBody(UpdateUserStatusRequest(status))
        }.body<ApiResponse<AdminUser>>().unwrap()
    }

    // ─── Admin solicitudes ───────────────────────────────────────────────────

    suspend fun getRegistrationRequests(): ApiResult<List<RegistrationRequest>> = safeCall {
        client.get("${NetworkConfig.apiBaseUrl}/admin/registration-requests")
            .body<ApiResponse<List<RegistrationRequest>>>().unwrap()
    }

    suspend fun approveRequest(id: Int): ApiResult<UserSummary> = safeCall {
        client.patch("${NetworkConfig.apiBaseUrl}/admin/registration-requests/$id/approve")
            .body<ApiResponse<UserSummary>>()
            .unwrap()
    }

    suspend fun rejectRequest(id: Int): ApiResult<Unit> = safeCall {
        client.patch("${NetworkConfig.apiBaseUrl}/admin/registration-requests/$id/reject")
        ApiResult.Success(Unit)
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    private fun buildFormData(req: PublicationRequest) = formData {
        append("title", req.title)
        append("content", req.content)
        append("isAnonymous", req.isAnonymous.toString())
        req.tagIds.forEach { tagId -> append("tags", tagId.toString()) }
        req.files.forEach { file ->
            append(
                key = "files",
                value = file.bytes,
                headers = Headers.build {
                    append(HttpHeaders.ContentType, file.mimeType)
                    append(HttpHeaders.ContentDisposition,
                        "form-data; name=\"files\"; filename=\"${file.name}\"")
                },
            )
        }
    }

    private inline fun <T> safeCall(block: () -> ApiResult<T>): ApiResult<T> = try {
        block()
    } catch (e: Exception) {
        ApiResult.Error(e.message ?: "Error de red")
    }
}
