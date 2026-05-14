package com.amigojolive.domain.model

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

/** Payload enviado a POST /auth/login. */
@Serializable
data class LoginRequest(
    @SerialName("institutionalEmail")
    val institutionalEmail: String,
    val password: String,
)

/** Respuesta de POST /auth/login → ApiResponse.data. */
@Serializable
data class AuthData(
    val token: String,
    val user: UserSummary,
)

/**
 * Usuario autenticado o hidratado desde /auth/me.
 * El backend devuelve institutionalEmail, firstName, lastName, status y role.
 */
@Serializable
data class UserSummary(
    val id: Int,
    @SerialName("institutionalEmail")
    val institutionalEmail: String,
    val firstName: String,
    val lastName: String,
    val role: String? = null,
    val status: String? = null,
    val profile: ProfileSummary? = null,
) {
    val email: String
        get() = institutionalEmail

    val isActive: Boolean
        get() = status == "ACTIVO"

    val fullName: String
        get() = listOf(firstName, lastName)
            .filter { it.isNotBlank() }
            .joinToString(" ")
            .ifBlank { institutionalEmail }
}

/** Perfil docente anidado en /auth/me, /profiles/me y usuarios admin. */
@Serializable
data class ProfileSummary(
    val id: Int? = null,
    val userId: Int? = null,
    val area: String? = null,
    val description: String? = null,
    val photoUrl: String? = null,
    val createdAt: String? = null,
    val updatedAt: String? = null,
)

/** Respuesta de /profiles/me. */
@Serializable
data class ProfileResponse(
    val id: Int,
    @SerialName("institutionalEmail")
    val institutionalEmail: String,
    val firstName: String,
    val lastName: String,
    val role: String? = null,
    val profile: ProfileSummary? = null,
) {
    val email: String
        get() = institutionalEmail

    val fullName: String
        get() = listOf(firstName, lastName)
            .filter { it.isNotBlank() }
            .joinToString(" ")
            .ifBlank { institutionalEmail }
}