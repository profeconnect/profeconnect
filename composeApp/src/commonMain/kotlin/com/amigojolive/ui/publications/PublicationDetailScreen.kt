package com.amigojolive.ui.publications

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
import com.amigojolive.navigation.CreateEditPublicationScreen
import com.amigojolive.ui.components.AmigojoSnackbarHost
import com.amigojolive.ui.components.LoadingOverlay

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PublicationDetailContent(
    publicationId: Int,
    viewModel: PublicationsViewModel,
    currentUserId: Int,
) {
    val navigator = LocalNavigator.currentOrThrow
    val state     by viewModel.state.collectAsState()
    val snackbar  = remember { SnackbarHostState() }
    var showDeleteDialog by remember { mutableStateOf(false) }

    LaunchedEffect(publicationId) { viewModel.loadDetail(publicationId) }

    LaunchedEffect(state.actionSuccess) {
        state.actionSuccess?.let {
            snackbar.showSnackbar(it)
            viewModel.clearMessages()
            navigator.pop()
        }
    }

    val pub = state.selectedPublication

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Publicación") },
                navigationIcon = {
                    IconButton(onClick = { navigator.pop() }) { Icon(Icons.Default.ArrowBack, null) }
                },
                actions = {
                    if (pub != null && pub.author?.id == currentUserId) {
                        IconButton(onClick = { navigator.push(CreateEditPublicationScreen(pub.id)) }) {
                            Icon(Icons.Default.Edit, "Editar")
                        }
                        IconButton(onClick = { showDeleteDialog = true }) {
                            Icon(Icons.Default.Delete, "Eliminar")
                        }
                    }
                },
            )
        },
        snackbarHost = { AmigojoSnackbarHost(snackbar) },
    ) { padding ->
        if (state.loading || pub == null) { LoadingOverlay(Modifier.padding(padding)); return@Scaffold }

        LazyColumn(modifier = Modifier.fillMaxSize().padding(padding).padding(16.dp)) {
            item {
                Text(pub.title, style = MaterialTheme.typography.headlineSmall)
                Spacer(Modifier.height(8.dp))

                if (pub.tags.isNotEmpty()) {
                    Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                        pub.tags.forEach { tag ->
                            FilterChip(selected = false, onClick = {}, label = { Text(tag.name) })
                        }
                    }
                    Spacer(Modifier.height(12.dp))
                }

                Text(pub.content, style = MaterialTheme.typography.bodyLarge)
                Spacer(Modifier.height(16.dp))

                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Default.Person, null, modifier = Modifier.size(16.dp),
                        tint = MaterialTheme.colorScheme.onSurfaceVariant)
                    Spacer(Modifier.width(4.dp))
                    val authorName = if (pub.isAnonymous) "Anónimo"
                    else pub.author?.displayName ?: "Docente"
                    Text(authorName, style = MaterialTheme.typography.labelMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant)
                    Spacer(Modifier.width(12.dp))
                    Icon(Icons.Default.CalendarToday, null, modifier = Modifier.size(14.dp),
                        tint = MaterialTheme.colorScheme.onSurfaceVariant)
                    Spacer(Modifier.width(4.dp))
                    Text(pub.createdAt.take(10), style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant)
                }

                if (pub.attachments.isNotEmpty()) {
                    Spacer(Modifier.height(16.dp))
                    Text("Archivos adjuntos", style = MaterialTheme.typography.titleSmall)
                    pub.attachments.forEach { attachment ->
                        TextButton(onClick = { /* abrir URL */ }) {
                            Icon(Icons.Default.AttachFile, null, modifier = Modifier.size(16.dp))
                            Spacer(Modifier.width(4.dp))
                            Text(
                                attachment.originalName,
                                style = MaterialTheme.typography.bodySmall
                            )
                        }
                    }
                }
            }
        }
    }

    if (showDeleteDialog) {
        AlertDialog(
            onDismissRequest = { showDeleteDialog = false },
            title = { Text("Eliminar publicación") },
            text = { Text("¿Seguro que deseas eliminar esta publicación? Esta acción no se puede deshacer.") },
            confirmButton = {
                TextButton(onClick = { showDeleteDialog = false; viewModel.delete(publicationId) },
                    colors = ButtonDefaults.textButtonColors(contentColor = MaterialTheme.colorScheme.error)) {
                    Text("Eliminar")
                }
            },
            dismissButton = {
                TextButton(onClick = { showDeleteDialog = false }) { Text("Cancelar") }
            },
        )
    }
}
