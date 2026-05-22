package com.engipilot.controller;

import com.engipilot.domain.Tache;
import com.engipilot.dto.request.TacheCreateRequest;
import com.engipilot.dto.response.TacheResponse;
import com.engipilot.service.TacheService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/api/v1/projets/{projetId}/taches")
@RequiredArgsConstructor
@Tag(name = "Tâches", description = "Gestion des tâches Kanban")
public class TacheController {

    private final TacheService tacheService;

    @GetMapping
    @Operation(summary = "Liste les tâches d'un projet")
    public ResponseEntity<List<TacheResponse>> lister(@PathVariable UUID projetId) {
        return ResponseEntity.ok(tacheService.listerParProjet(projetId));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Créer une nouvelle tâche")
    public ResponseEntity<TacheResponse> creer(
        @PathVariable UUID projetId,
        @Valid @RequestBody TacheCreateRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(tacheService.creer(projetId, req));
    }

    @PatchMapping("/{id}/statut")
    @Operation(summary = "Changer le statut d'une tâche (Kanban move)")
    public ResponseEntity<TacheResponse> changerStatut(
        @PathVariable UUID id,
        @RequestParam Tache.Statut statut) {
        return ResponseEntity.ok(tacheService.changerStatut(id, statut));
    }

    @PatchMapping("/{id}/avancement")
    @Operation(summary = "Mettre à jour l'avancement d'une tâche")
    public ResponseEntity<TacheResponse> updateAvancement(
        @PathVariable UUID id,
        @RequestParam int avancement) {
        return ResponseEntity.ok(tacheService.updateAvancement(id, avancement));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public ResponseEntity<Void> supprimer(@PathVariable UUID id) {
        tacheService.supprimer(id);
        return ResponseEntity.noContent().build();
    }
}
