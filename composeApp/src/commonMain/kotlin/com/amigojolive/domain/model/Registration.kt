package com.amigojolive.domain.model

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

/** Payload enviado a POST /auth/register-request */
@Serializable
data class RegisterRequest(
    @SerialName("institutionalEmail")
    val institutionalEmail: String,
    val password: String,
    val firstName: String,
    val lastName: String,
    val area: String? = null,
    val description: String? = null,
)

/** Elemento de GET /admin/registration-requests */
@Serializable
data class RegistrationRequest(
    val id: Int,
    @SerialName("institutionalEmail")
    val institutionalEmail: String,
    val firstName: String,
    val lastName: String,
    val area: String? = null,
    val description: String? = null,
    val status: String,
    val reviewComment: String? = null,
    val reviewedAt: String? = null,
    val reviewedBy: ReviewedBy? = null,
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
}

@Serializable
data class ReviewedBy(
    val id: Int,
    val firstName: String,
    val lastName: String,
    @SerialName("institutionalEmail")
    val institutionalEmail: String,
) {
    val fullName: String
        get() = listOf(firstName, lastName)
            .filter { it.isNotBlank() }
            .joinToString(" ")
            .ifBlank { institutionalEmail }
}
