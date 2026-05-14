package com.amigojolive.ui.profile

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import cafe.adriel.voyager.navigator.LocalNavigator
import cafe.adriel.voyager.navigator.currentOrThrow
import com.amigojolive.ui.components.AmigojoButton
import com.amigojolive.ui.components.AmigojoTextField
import com.amigojolive.ui.components.AmigojoSnackbarHost
import com.amigojolive.ui.components.LoadingOverlay

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ProfileContent(viewModel: ProfileViewModel) {
    val navigator = LocalNavigator.currentOrThrow
    val state     by viewModel.state.collectAsState()
    val snackbar  = remember { SnackbarHostState() }

    var fullName    by remember { mutableStateOf("") }
    var area        by remember { mutableStateOf("") }
    var description by remember { mutableStateOf("") }
    var editing     by remember { mutableStateOf(false) }

    LaunchedEffect(state.profile) {
        state.profile?.let { p ->
            fullName = p.fullName
            area = p.profile?.area ?: ""
            description = p.profile?.description ?: ""
        }
    }

    LaunchedEffect(state.error, state.successMessage) {
        (state.error ?: state.successMessage)?.let {
            snackbar.showSnackbar(it)
            viewModel.clearMessages()
            if (state.successMessage != null) editing = false
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Mi perfil") },
                navigationIcon = {
                    IconButton(onClick = { navigator.pop() }) { Icon(Icons.Default.ArrowBack, null) }
                },
                actions = {
                    IconButton(onClick = { editing = !editing }) {
                        Icon(if (editing) Icons.Default.Close else Icons.Default.Edit, null)
                    }
                },
            )
        },
        snackbarHost = { AmigojoSnackbarHost(snackbar) },
    ) { padding ->
        if (state.loading) { LoadingOverlay(Modifier.padding(padding)); return@Scaffold }

        LazyColumn(
            modifier = Modifier.fillMaxSize().padding(padding).padding(horizontal = 24.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp),
            contentPadding = PaddingValues(vertical = 24.dp),
        ) {
            item {
                // Avatar placeholder
                Box(
                    modifier = Modifier.fillMaxWidth(),
                    contentAlignment = Alignment.Center,
                ) {
                    Surface(
                        modifier = Modifier.size(96.dp),
                        shape = MaterialTheme.shapes.extraLarge,
                        color = MaterialTheme.colorScheme.primaryContainer,
                    ) {
                        Icon(
                            Icons.Default.Person,
                            contentDescription = null,
                            modifier = Modifier.padding(24.dp),
                            tint = MaterialTheme.colorScheme.onPrimaryContainer,
                        )
                    }
                }
            }

            item {
                Text(
                    state.currentUser?.email ?: "",
                    style = MaterialTheme.typography.labelMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier.fillMaxWidth(),
                )
                Chip(role = state.currentUser?.role ?: "")
            }

            item { Divider() }

            item {
                if (editing) {
                    AmigojoTextField(fullName, { fullName = it }, "Nombre completo")
                } else {
                    ProfileField("Nombre", fullName.ifBlank { "—" })
                }
            }

            item {
                if (editing) {
                    AmigojoTextField(area, { area = it }, "Área / departamento")
                } else {
                    ProfileField("Área", area.ifBlank { "—" })
                }
            }

            item {
                if (editing) {
                    AmigojoTextField(description, { description = it }, "Descripción", singleLine = false)
                } else {
                    ProfileField("Descripción", description.ifBlank { "—" })
                }
            }

            if (editing) {
                item {
                    AmigojoButton(
                        text = "Guardar cambios",
                        loading = state.loading,
                        onClick = { viewModel.update(fullName, area, description) },
                    )
                }
            }
        }
    }
}

@Composable
private fun ProfileField(label: String, value: String) {
    Column {
        Text(label, style = MaterialTheme.typography.labelMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant)
        Text(value, style = MaterialTheme.typography.bodyLarge)
    }
}

@Composable
private fun Chip(role: String) {
    val label = when (role) {
        "admin"    -> "Administrador"
        "docente"  -> "Docente"
        else       -> role.replaceFirstChar { it.uppercase() }
    }
    SuggestionChip(onClick = {}, label = { Text(label) })
}
