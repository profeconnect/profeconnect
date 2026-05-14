package com.amigojolive.navigation

import androidx.compose.runtime.*
import cafe.adriel.voyager.core.model.rememberScreenModel
import cafe.adriel.voyager.core.screen.Screen
import cafe.adriel.voyager.navigator.LocalNavigator
import cafe.adriel.voyager.navigator.currentOrThrow
import com.amigojolive.LocalAppDeps
import com.amigojolive.core.session.SessionStore
import com.amigojolive.ui.admin.*
import com.amigojolive.ui.auth.*
import com.amigojolive.ui.chatbot.*
import com.amigojolive.ui.home.*
import com.amigojolive.ui.profile.*
import com.amigojolive.ui.publications.*

/**
 * Catálogo de pantallas.
 *
 * Decisión nav-kmp-choice: se eligió **Voyager** sobre Navigation Compose
 * porque Navigation Compose es tosca en web (jsMain). Voyager es el estándar
 * de facto en KMP: ScreenModel = ViewModel multiplataforma, con screenModelScope
 * que cancela automáticamente al salir del backstack.
 *
 * Segmentación de roles:
 *   role == "docente" → flujo Teacher (Home, Feed, Chatbot, Perfil)
 *   role == "admin"   → flujo Admin   (Usuarios, Solicitudes, Categorías)
 * Los deep links a rutas admin desde rol docente son bloqueados por guardas
 * en cada Screen que verifican SessionStore.currentUser.
 */

// ── Auth ──────────────────────────────────────────────────────────────────────

object LoginScreen : Screen {
    @Composable
    override fun Content() {
        val deps = LocalAppDeps.current
        val vm   = rememberScreenModel { AuthViewModel(deps.authRepo) }
        LoginScreenContent(vm)
    }
}

object RegisterScreen : Screen {
    @Composable
    override fun Content() {
        val deps = LocalAppDeps.current
        val vm   = rememberScreenModel { AuthViewModel(deps.authRepo) }
        RegisterScreenContent(vm)
    }
}

object AccessDeniedScreen : Screen {
    @Composable
    override fun Content() {
        val deps = LocalAppDeps.current
        AccessDeniedContent(onLogout = { deps.authRepo.logout() })
    }
}

// ── Docente ───────────────────────────────────────────────────────────────────

object TeacherHomeScreen : Screen {
    @Composable
    override fun Content() {
        val navigator = LocalNavigator.currentOrThrow
        val deps = LocalAppDeps.current
        val user = SessionStore.currentUser.collectAsState().value
        if (user == null) {
            SessionRequiredContent()
            return
        }
        val vm   = rememberScreenModel { PublicationsViewModel(deps.pubRepo, deps.catRepo, user.id) }
        TeacherHomeContent(
            publicationsViewModel = vm,
            currentUser = user,
            onNavigateToCreatePost = { navigator.push(CreatePublicationScreen) },
            onLogout = {
                deps.authRepo.logout()
                SessionStore.clear()
                navigator.replaceAll(LoginScreen)
            }
        )
    }
}

object FeedScreen : Screen {
    @Composable
    override fun Content() {
        val deps = LocalAppDeps.current
        val user = SessionStore.currentUser.collectAsState().value
        if (user == null) {
            SessionRequiredContent()
            return
        }
        val vm   = rememberScreenModel { PublicationsViewModel(deps.pubRepo, deps.catRepo, user.id) }
        FeedContent(vm)
    }
}

object MyPublicationsScreen : Screen {
    @Composable
    override fun Content() {
        val deps = LocalAppDeps.current
        val user = SessionStore.currentUser.collectAsState().value
        if (user == null) {
            SessionRequiredContent()
            return
        }
        val vm   = rememberScreenModel { PublicationsViewModel(deps.pubRepo, deps.catRepo, user.id) }
        MyPublicationsContent(vm)
    }
}

data class PublicationDetailScreen(val publicationId: Int) : Screen {
    @Composable
    override fun Content() {
        val deps = LocalAppDeps.current
        val user = SessionStore.currentUser.collectAsState().value
        if (user == null) {
            SessionRequiredContent()
            return
        }
        val vm   = rememberScreenModel { PublicationsViewModel(deps.pubRepo, deps.catRepo, user.id) }
        PublicationDetailContent(publicationId, vm, user.id)
    }
}

data class CreateEditPublicationScreen(val publicationId: Int? = null) : Screen {
    @Composable
    override fun Content() {
        val deps = LocalAppDeps.current
        val user = SessionStore.currentUser.collectAsState().value
        if (user == null) {
            SessionRequiredContent()
            return
        }
        val vm   = rememberScreenModel { PublicationsViewModel(deps.pubRepo, deps.catRepo, user.id) }
        CreateEditPublicationContent(publicationId, vm)
    }
}

object CreatePublicationScreen : Screen {
    @Composable
    override fun Content() {
        CreateEditPublicationScreen().Content()
    }
}

object ProfileScreen : Screen {
    @Composable
    override fun Content() {
        val deps = LocalAppDeps.current
        val user = SessionStore.currentUser.collectAsState().value
        if (user == null) {
            SessionRequiredContent()
            return
        }
        val vm   = rememberScreenModel { ProfileViewModel(deps.apiService, user) }
        ProfileContent(vm)
    }
}

object ChatbotScreen : Screen {
    @Composable
    override fun Content() {
        val deps = LocalAppDeps.current
        val vm   = rememberScreenModel { ChatbotViewModel(deps.socketService) }
        ChatbotContent(vm)
    }
}

// ── Admin — bloquear si role != "admin" ───────────────────────────────────────

object AdminHomeScreen : Screen {
    @Composable
    override fun Content() {
        val navigator = LocalNavigator.currentOrThrow
        val deps = LocalAppDeps.current
        val user = SessionStore.currentUser.collectAsState().value
        if (user == null) {
            SessionRequiredContent()
            return
        }
        if (user.role != "admin") {
            AccessDeniedContent(onLogout = {
                deps.authRepo.logout()
                SessionStore.clear()
            })
            return
        }
        val vm   = rememberScreenModel { AdminViewModel(deps.adminRepo, deps.catRepo) }
        AdminHomeContent(vm, onLogout = {
            deps.authRepo.logout()
            SessionStore.clear()
            navigator.replaceAll(LoginScreen)
        })
    }
}

object AdminUsersScreen : Screen {
    @Composable
    override fun Content() {
        val deps = LocalAppDeps.current
        val user = SessionStore.currentUser.collectAsState().value
        if (user == null) {
            SessionRequiredContent()
            return
        }
        if (user.role != "admin") {
            AccessDeniedContent(onLogout = {
                deps.authRepo.logout()
                SessionStore.clear()
            })
            return
        }
        val vm   = rememberScreenModel { AdminViewModel(deps.adminRepo, deps.catRepo) }
        AdminUsersContent(vm)
    }
}

object AdminRequestsScreen : Screen {
    @Composable
    override fun Content() {
        val deps = LocalAppDeps.current
        val user = SessionStore.currentUser.collectAsState().value
        if (user == null) {
            SessionRequiredContent()
            return
        }
        if (user.role != "admin") {
            AccessDeniedContent(onLogout = {
                deps.authRepo.logout()
                SessionStore.clear()
            })
            return
        }
        val vm   = rememberScreenModel { AdminViewModel(deps.adminRepo, deps.catRepo) }
        AdminRequestsContent(vm)
    }
}

object AdminCategoriesScreen : Screen {
    @Composable
    override fun Content() {
        val deps = LocalAppDeps.current
        val user = SessionStore.currentUser.collectAsState().value
        if (user == null) {
            SessionRequiredContent()
            return
        }
        if (user.role != "admin") {
            AccessDeniedContent(onLogout = {
                deps.authRepo.logout()
                SessionStore.clear()
            })
            return
        }
        val vm   = rememberScreenModel { AdminViewModel(deps.adminRepo, deps.catRepo) }
        AdminCategoriesContent(vm)
    }
}

@Composable
private fun SessionRequiredContent() {
    val navigator = LocalNavigator.currentOrThrow
    LaunchedEffect(Unit) {
        navigator.replaceAll(LoginScreen)
    }
}
