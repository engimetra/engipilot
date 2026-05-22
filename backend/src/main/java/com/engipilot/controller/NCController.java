package com.engipilot.controller;

import com.engipilot.domain.NonConformite;
import com.engipilot.dto.request.NCCreateRequest;
import com.engipilot.dto.response.NCResponse;
import com.engipilot.service.NCService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/api/v1/projets/{projetId}/nc")
@RequiredArgsConstructor
@Tag(name = "Non-Conformités", description = "Gestion qualité NC")
public class NCController {

    private final NCService ncService;

    @GetMapping
    @Operation(summary = "Liste les NC d'un projet")
    public ResponseEntity<List<NCResponse>> lister(@PathVariable UUID projetId) {
        return ResponseEntity.ok(ncService.listerParProjet(projetId));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Créer une non-conformité")
    public ResponseEntity<NCResponse> creer(
        @PathVariable UUID projetId,
        @Valid @RequestBody NCCreateRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ncService.creer(projetId, req));
    }

    @PatchMapping("/{id}/statut")
    @Operation(summary = "Changer le statut d'une NC")
    public ResponseEntity<NCResponse> changerStatut(
        @PathVariable UUID id,
        @RequestParam NonConformite.Statut statut) {
        return ResponseEntity.ok(ncService.changerStatut(id, statut));
    }
}
