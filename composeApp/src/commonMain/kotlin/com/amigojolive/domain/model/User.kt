package com.amigojolive.domain.model

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

/** Elemento de GET /admin/users */
@Serializable
data class AdminUser(
    val id: Int,
    @SerialName("institutionalEmail")
    val institutionalEmail: String,
    val firstName: String,
    val lastName: String,
    val status: String,
    val role: String? = null,
    val profile: ProfileSummary? = null,
    val lastLoginAt: String? = null,
    val createdAt: String,
    val updatedAt: String? = null,
) {
    val email: String
        get() = institutionalEmail

    val fullName: String
        get() = listOf(firstName, lastName)
            .filter { it.isNotBlank() }
            .joinToString(" ")
            .ifBlank { institutionalEmail }

    val isActive: Boolean
        get() = status == "ACTIVO"
}

/** Payload de PATCH /admin/users/:id/status */
@Serializable
data class UpdateUserStatusRequest(val status: String)

/** Payload de PATCH /profiles/me */
@Serializable
data class UpdateProfileRequest(
    val firstName: String? = null,
    val lastName: String? = null,
    val area: String? = null,
    val description: String? = null,
    val photoUrl: String? = null,
)
