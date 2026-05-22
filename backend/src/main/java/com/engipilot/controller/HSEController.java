package com.engipilot.controller;

import com.engipilot.dto.request.IncidentCreateRequest;
import com.engipilot.dto.response.IncidentResponse;
import com.engipilot.domain.IncidentHSE;
import com.engipilot.service.HSEService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

import org.springframework.data.domain.Page;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/projets/{projetId}/hse")
@RequiredArgsConstructor
@Tag(name = "HSE", description = "Hygiène Sécurité Environnement")
public class HSEController {

    private final HSEService hseService;

    @GetMapping("/incidents")
    @Operation(summary = "Liste les incidents HSE d'un projet (paginé)")
    public ResponseEntity<Page<IncidentResponse>> lister(
            @PathVariable UUID projetId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(hseService.listerParProjet(projetId, page, size));
    }

    @PostMapping("/incidents")
    @Operation(summary = "Déclarer un incident HSE")
    public ResponseEntity<IncidentResponse> declarer(
            @PathVariable UUID projetId,
            @Valid @RequestBody IncidentCreateRequest req) {

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(hseService.declarer(projetId, req));
    }

    @PatchMapping("/incidents/{id}/statut")
    @Operation(summary = "Changer le statut d'un incident")
    public ResponseEntity<IncidentResponse> changerStatut(
            @PathVariable UUID id,
            @RequestParam IncidentHSE.Statut statut) {

        return ResponseEntity.ok(hseService.changerStatut(id, statut));
    }
}