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

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/projets/{projetId}/hse")
@RequiredArgsConstructor
@Tag(name = "HSE", description = "Hygiène Sécurité Environnement")
public class HSEController {

    private final HSEService hseService;

    @GetMapping("/incidents")
    @Operation(summary = "Liste les incidents HSE d'un projet")
    public ResponseEntity<List<IncidentResponse>> lister(@PathVariable UUID projetId) {
        return ResponseEntity.ok(hseService.listerParProjet(projetId));
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