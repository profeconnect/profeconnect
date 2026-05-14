package com.amigojolive.ui.auth

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import cafe.adriel.voyager.navigator.LocalNavigator
import cafe.adriel.voyager.navigator.currentOrThrow
import com.amigojolive.navigation.AccessDeniedScreen
import com.amigojolive.navigation.AdminHomeScreen
import com.amigojolive.navigation.RegisterScreen
import com.amigojolive.navigation.TeacherHomeScreen
import com.amigojolive.ui.components.AmigojoButton
import com.amigojolive.ui.components.AmigojoTextField
import com.amigojolive.ui.components.AmigojoSnackbarHost

@Composable
fun LoginScreenContent(viewModel: AuthViewModel) {
    val navigator = LocalNavigator.currentOrThrow
    val state     by viewModel.state.collectAsState()
    val snackbar  = remember { SnackbarHostState() }
    var email     by remember { mutableStateOf("") }
    var password  by remember { mutableStateOf("") }

    LaunchedEffect(state.navigateTo) {
        when (state.navigateTo) {
            NavigationTarget.ADMIN_HOME   -> { viewModel.clearNavigationTarget(); navigator.replaceAll(AdminHomeScreen) }
            NavigationTarget.TEACHER_HOME -> { viewModel.clearNavigationTarget(); navigator.replaceAll(TeacherHomeScreen) }
            NavigationTarget.ACCESS_DENIED -> { viewModel.clearNavigationTarget(); navigator.replaceAll(AccessDeniedScreen) }
            else -> Unit
        }
    }

    LaunchedEffect(state.error) {
        state.error?.let { snackbar.showSnackbar(it); viewModel.clearError() }
    }

    Scaffold(snackbarHost = { AmigojoSnackbarHost(snackbar) }) { padding ->
        Column(
            modifier = Modifier.fillMaxSize().padding(padding).padding(horizontal = 24.dp),
            verticalArrangement = Arrangement.Center,
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            Text("AmigojoLive", style = MaterialTheme.typography.headlineLarge,
                color = MaterialTheme.colorScheme.primary)
            Spacer(Modifier.height(8.dp))
            Text("Plataforma educativa docente", style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant)
            Spacer(Modifier.height(40.dp))

            AmigojoTextField(email, { email = it }, "Correo electrónico")
            Spacer(Modifier.height(12.dp))
            AmigojoTextField(password, { password = it }, "Contraseña", isPassword = true)
            Spacer(Modifier.height(24.dp))

            AmigojoButton("Iniciar sesión",
                onClick  = { viewModel.login(email, password) },
                loading  = state.loading,
            )
            Spacer(Modifier.height(16.dp))
            TextButton(onClick = { navigator.push(RegisterScreen) }) {
                Text("¿No tienes cuenta? Solicita acceso")
            }
        }
    }
}
