package com.amigojolive.ui.admin

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import cafe.adriel.voyager.navigator.LocalNavigator
import cafe.adriel.voyager.navigator.currentOrThrow
import com.amigojolive.domain.model.AdminUser
import com.amigojolive.domain.model.Category
import com.amigojolive.domain.model.RegistrationRequest
import com.amigojolive.navigation.*
import com.amigojolive.ui.components.AmigojoSnackbarHost
import com.amigojolive.ui.components.LoadingOverlay

// ── Admin Home ───────────────────────────────────────────────────────────────

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AdminHomeContent(viewModel: AdminViewModel, onLogout: () -> Unit) {
    val navigator = LocalNavigator.currentOrThrow

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Panel Administrador") },
                actions = {
                    IconButton(onClick = onLogout) { Icon(Icons.Default.Logout, "Cerrar sesión") }
                },
            )
        },
        bottomBar = {
            NavigationBar {
                NavigationBarItem(
                    selected = false, onClick = { navigator.push(AdminUsersScreen) },
                    icon = { Icon(Icons.Default.People, null) }, label = { Text("Usuarios") },
                )
                NavigationBarItem(
                    selected = false, onClick = { navigator.push(AdminRequestsScreen) },
                    icon = { Icon(Icons.Default.Assignment, null) }, label = { Text("Solicitudes") },
                )
                NavigationBarItem(
                    selected = false, onClick = { navigator.push(AdminCategoriesScreen) },
                    icon = { Icon(Icons.Default.Category, null) }, label = { Text("Categorías") },
                )
            }
        },
    ) { padding ->
        Column(
            modifier = Modifier.fillMaxSize().padding(padding).padding(24.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp),
        ) {
            Text("Bienvenido, Administrador", style = MaterialTheme.typography.headlineSmall)

            AdminMenuCard("Usuarios", Icons.Default.People, "Gestionar usuarios y estados") {
                navigator.push(AdminUsersScreen)
            }
            AdminMenuCard("Solicitudes de registro", Icons.Default.Assignment, "Aprobar o rechazar accesos") {
                navigator.push(AdminRequestsScreen)
            }
            AdminMenuCard("Categorías / etiquetas", Icons.Default.Category, "CRUD de categorías para publicaciones") {
                navigator.push(AdminCategoriesScreen)
            }
        }
    }
}

@Composable
private fun AdminMenuCard(
    title: String,
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    subtitle: String,
    onClick: () -> Unit,
) {
    Card(modifier = Modifier.fillMaxWidth(), onClick = onClick) {
        Row(
            modifier = Modifier.padding(16.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Icon(icon, null, modifier = Modifier.size(32.dp),
                tint = MaterialTheme.colorScheme.primary)
            Spacer(Modifier.width(16.dp))
            Column {
                Text(title, style = MaterialTheme.typography.titleMedium)
                Text(subtitle, style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
            Spacer(Modifier.weight(1f))
            Icon(Icons.Default.ChevronRight, null)
        }
    }
}

// ── Admin Usuarios ────────────────────────────────────────────────────────────

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AdminUsersContent(viewModel: AdminViewModel) {
    val navigator = LocalNavigator.currentOrThrow
    val state     by viewModel.state.collectAsState()
    val snackbar  = remember { SnackbarHostState() }

    LaunchedEffect(Unit) { viewModel.loadUsers() }
    LaunchedEffect(state.error, state.successMessage) {
        (state.error ?: state.successMessage)?.let {
            snackbar.showSnackbar(it); viewModel.clearMessages()
        }
    }

    Scaffold(
        topBar = { TopAppBar(title = { Text("Usuarios") }, navigationIcon = {
            IconButton(onClick = { navigator.pop() }) { Icon(Icons.Default.ArrowBack, null) }
        }) },
        snackbarHost = { AmigojoSnackbarHost(snackbar) },
    ) { padding ->
        if (state.loading) { LoadingOverlay(Modifier.padding(padding)); return@Scaffold }
        LazyColumn(modifier = Modifier.fillMaxSize().padding(padding),
            contentPadding = PaddingValues(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            items(state.users, key = { it.id }) { user ->
                UserCard(user, onToggleActive = { viewModel.toggleUserActive(user.id, user.status) })
            }
        }
    }
}

@Composable
private fun UserCard(user: AdminUser, onToggleActive: () -> Unit) {
    Card(modifier = Modifier.fillMaxWidth()) {
        Row(
            modifier = Modifier.padding(16.dp).fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Column(Modifier.weight(1f)) {
                Text(user.fullName, style = MaterialTheme.typography.titleSmall)
                Text(user.email, style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant)
                Text(user.role ?: "Sin rol", style = MaterialTheme.typography.labelSmall)
            }
            Switch(checked = user.isActive, onCheckedChange = { onToggleActive() })
        }
    }
}

// ── Admin Solicitudes ─────────────────────────────────────────────────────────

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AdminRequestsContent(viewModel: AdminViewModel) {
    val navigator = LocalNavigator.currentOrThrow
    val state     by viewModel.state.collectAsState()
    val snackbar  = remember { SnackbarHostState() }

    LaunchedEffect(Unit) { viewModel.loadRequests() }
    LaunchedEffect(state.error, state.successMessage) {
        (state.error ?: state.successMessage)?.let {
            snackbar.showSnackbar(it); viewModel.clearMessages()
        }
    }

    Scaffold(
        topBar = { TopAppBar(title = { Text("Solicitudes de registro") }, navigationIcon = {
            IconButton(onClick = { navigator.pop() }) { Icon(Icons.Default.ArrowBack, null) }
        }) },
        snackbarHost = { AmigojoSnackbarHost(snackbar) },
    ) { padding ->
        if (state.loading) { LoadingOverlay(Modifier.padding(padding)); return@Scaffold }
        if (state.requests.isEmpty()) {
            Box(Modifier.fillMaxSize().padding(padding), contentAlignment = Alignment.Center) {
                Text("No hay solicitudes pendientes.", style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
            return@Scaffold
        }
        LazyColumn(modifier = Modifier.fillMaxSize().padding(padding),
            contentPadding = PaddingValues(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            items(state.requests, key = { it.id }) { req ->
                RequestCard(req,
                    onApprove = { viewModel.approveRequest(req.id) },
                    onReject  = { viewModel.rejectRequest(req.id) },
                )
            }
        }
    }
}

@Composable
private fun RequestCard(req: RegistrationRequest, onApprove: () -> Unit, onReject: () -> Unit) {
    Card(modifier = Modifier.fillMaxWidth()) {
        Column(modifier = Modifier.padding(16.dp)) {
            Text(req.fullName, style = MaterialTheme.typography.titleSmall)
            Text(req.email,    style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant)
            Text("Área: ${req.area ?: "Sin área"}", style = MaterialTheme.typography.bodySmall)
            Spacer(Modifier.height(12.dp))
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                OutlinedButton(onClick = onReject,
                    colors = ButtonDefaults.outlinedButtonColors(contentColor = MaterialTheme.colorScheme.error)) {
                    Text("Rechazar")
                }
                Button(onClick = onApprove) { Text("Aprobar") }
            }
        }
    }
}

// ── Admin Categorías ──────────────────────────────────────────────────────────

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AdminCategoriesContent(viewModel: AdminViewModel) {
    val navigator  = LocalNavigator.currentOrThrow
    val state      by viewModel.state.collectAsState()
    val snackbar   = remember { SnackbarHostState() }
    var newName    by remember { mutableStateOf("") }
    var editId     by remember { mutableStateOf<Int?>(null) }
    var editName   by remember { mutableStateOf("") }

    LaunchedEffect(Unit) { viewModel.loadCategories() }
    LaunchedEffect(state.error, state.successMessage) {
        (state.error ?: state.successMessage)?.let {
            snackbar.showSnackbar(it); viewModel.clearMessages()
        }
    }

    Scaffold(
        topBar = { TopAppBar(title = { Text("Categorías") }, navigationIcon = {
            IconButton(onClick = { navigator.pop() }) { Icon(Icons.Default.ArrowBack, null) }
        }) },
        snackbarHost = { AmigojoSnackbarHost(snackbar) },
    ) { padding ->
        LazyColumn(modifier = Modifier.fillMaxSize().padding(padding),
            contentPadding = PaddingValues(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            item {
                Row(verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedTextField(
                        value = newName, onValueChange = { newName = it },
                        label = { Text("Nueva categoría") }, modifier = Modifier.weight(1f),
                        singleLine = true,
                    )
                    IconButton(onClick = { viewModel.createCategory(newName); newName = "" },
                        enabled = newName.isNotBlank()) {
                        Icon(Icons.Default.Add, "Crear")
                    }
                }
            }

            items(state.categories, key = { it.id }) { cat ->
                CategoryRow(
                    cat = cat,
                    editing = editId == cat.id,
                    editName = editName,
                    onEditNameChange = { editName = it },
                    onStartEdit = { editId = cat.id; editName = cat.name },
                    onSaveEdit  = { viewModel.updateCategory(cat.id, editName); editId = null },
                    onCancelEdit = { editId = null },
                    onDelete = { viewModel.deleteCategory(cat.id) },
                )
            }
        }
    }
}

@Composable
private fun CategoryRow(
    cat: Category,
    editing: Boolean,
    editName: String,
    onEditNameChange: (String) -> Unit,
    onStartEdit: () -> Unit,
    onSaveEdit: () -> Unit,
    onCancelEdit: () -> Unit,
    onDelete: () -> Unit,
) {
    Card(modifier = Modifier.fillMaxWidth()) {
        Row(modifier = Modifier.padding(8.dp).fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically) {
            if (editing) {
                OutlinedTextField(
                    value = editName, onValueChange = onEditNameChange,
                    modifier = Modifier.weight(1f), singleLine = true,
                )
                IconButton(onClick = onSaveEdit)   { Icon(Icons.Default.Check, "Guardar") }
                IconButton(onClick = onCancelEdit) { Icon(Icons.Default.Close, "Cancelar") }
            } else {
                Text(cat.name, modifier = Modifier.weight(1f), style = MaterialTheme.typography.bodyMedium)
                IconButton(onClick = onStartEdit) { Icon(Icons.Default.Edit,   "Editar") }
                IconButton(onClick = onDelete)    { Icon(Icons.Default.Delete, "Eliminar",
                    tint = MaterialTheme.colorScheme.error) }
            }
        }
    }
}
