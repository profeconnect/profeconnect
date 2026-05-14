package com.amigojolive.domain.model

import kotlinx.serialization.Serializable

/**
 * Respuesta de GET /publications y GET /publications/:id
 * Mapeada desde mapPostToResponse() en publication.service.js.
 *
 * Campos clave: id, title, content, isAnonymous, status, attachments,
 * tags (lista de Category) y author (anonimizado o con role).
 */
@Serializable
data class Publication(
    val id: Int,
    val title: String,
    val content: String,
    val isAnonymous: Boolean = false,
    val status: String = "PUBLISHED",
    val attachments: List<PublicationAttachment> = emptyList(),
    val tags: List<Category> = emptyList(),
    val author: PublicationAuthor? = null,
    val createdAt: String = "",
    val updatedAt: String = "",
)

@Serializable
data class PublicationAuthor(
    val id: Int? = null,
    val firstName: String? = null,
    val lastName: String? = null,
    val institutionalEmail: String? = null,
    val role: String? = null,
) {
    val displayName: String
        get() = listOf(firstName, lastName)
            .filterNotNull()
            .filter { it.isNotBlank() }
            .joinToString(" ")
            .ifBlank { role ?: institutionalEmail ?: "Docente" }
}

@Serializable
data class PublicationAttachment(
    val filename: String,
    val originalName: String,
    val mimeType: String,
    val path: String,
    val size: Int,
    val type: String,
)

/**
 * Payload para crear/editar publicaciones vía multipart/form-data.
 *
 * El backend valida con publication.dto.js:
 *   - title: string, max 150 chars (requerido)
 *   - content: string (requerido)
 *   - isAnonymous: boolean (opcional)
 *   - tags: array de enteros (ids de Category)
 *   - files: array de archivos (campo "files" del middleware multer)
 *
 * La serialización multipart la gestiona Ktor submitFormWithBinaryData().
 */
data class PublicationRequest(
    val title: String,
    val content: String,
    val isAnonymous: Boolean = false,
    val tagIds: List<Int> = emptyList(),
    val files: List<FileAttachment> = emptyList(),
)

data class FileAttachment(
    val name: String,
    val bytes: ByteArray,
    val mimeType: String,
)
