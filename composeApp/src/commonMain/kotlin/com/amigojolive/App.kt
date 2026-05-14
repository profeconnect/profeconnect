package com.amigojolive

import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.compositionLocalOf
import cafe.adriel.voyager.navigator.Navigator
import cafe.adriel.voyager.transitions.SlideTransition
import com.amigojolive.core.network.ApiService
import com.amigojolive.core.network.NetworkConfig
import com.amigojolive.core.network.createHttpClient
import com.amigojolive.core.session.TokenStorage
import com.amigojolive.core.socket.ChatSocketService
import com.amigojolive.domain.repository.*
import com.amigojolive.navigation.LoginScreen
import com.amigojolive.ui.theme.AmigojoTheme

/**
 * Raíz de composición compartida entre Android (MainActivity) y web (main.kt).
 * Instancia el grafo de dependencias de forma manual para mantener commonMain
 * libre de frameworks DI que no soporten todos los targets KMP.
 */
@Composable
fun App(tokenStorage: TokenStorage) {
    val httpClient    = createHttpClient(tokenStorage)
    val apiService    = ApiService(httpClient)
    val authRepo      = AuthRepository(apiService, tokenStorage)
    val pubRepo       = PublicationRepository(apiService)
    val catRepo       = CategoryRepository(apiService)
    val adminRepo     = AdminRepository(apiService)
    val socketService = ChatSocketService(
        serverUrl     = NetworkConfig.socketBaseUrl,
        tokenProvider = { tokenStorage.getToken() },
    )

    AmigojoTheme {
        CompositionLocalProvider(
            LocalAppDeps provides AppDeps(
                authRepo      = authRepo,
                pubRepo       = pubRepo,
                catRepo       = catRepo,
                adminRepo     = adminRepo,
                apiService    = apiService,
                socketService = socketService,
                tokenStorage  = tokenStorage,
            ),
        ) {
            Navigator(LoginScreen) { navigator -> SlideTransition(navigator) }
        }
    }
}

/** Dependencias globales accesibles desde cualquier Screen vía LocalAppDeps. */
data class AppDeps(
    val authRepo:      AuthRepository,
    val pubRepo:       PublicationRepository,
    val catRepo:       CategoryRepository,
    val adminRepo:     AdminRepository,
    val apiService:    ApiService,
    val socketService: ChatSocketService,
    val tokenStorage:  TokenStorage,
)

val LocalAppDeps = compositionLocalOf<AppDeps> {
    error("AppDeps no provisto. Asegúrate de envolver el árbol con App().")
}
