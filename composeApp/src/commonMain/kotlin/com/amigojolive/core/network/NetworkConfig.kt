package com.amigojolive.core.network

/**
 * Configuración base de red por plataforma.
 *
 * Durante el desarrollo local:
 * - Android emulador usa 10.0.2.2 para alcanzar el host
 * - Web usa localhost directamente
 */
expect object NetworkConfig {
    val apiBaseUrl: String
    val socketBaseUrl: String
}
