package com.engipilot.controller;

import com.engipilot.dto.request.RapportCreateRequest;
import com.engipilot.dto.response.RapportResponse;
import com.engipilot.service.RapportService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/api/v1/projets/{projetId}/rapports")
@RequiredArgsConstructor
@Tag(name = "Rapports", description = "Rapports journaliers de chantier")
public class RapportController {

    private final RapportService rapportService;

    @GetMapping
    @Operation(summary = "Liste les rapports d'un projet (paginé)")
    public ResponseEntity<Page<RapportResponse>> lister(
        @PathVariable UUID projetId,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(rapportService.listerParProjet(projetId, page, size));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Soumettre un rapport journalier")
    public ResponseEntity<RapportResponse> creer(
        @PathVariable UUID projetId,
        @Valid @RequestBody RapportCreateRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(rapportService.creer(projetId, req));
    }

    @PatchMapping("/{id}/valider")
    @Operation(summary = "Valider un rapport soumis")
    public ResponseEntity<RapportResponse> valider(@PathVariable UUID id) {
        return ResponseEntity.ok(rapportService.valider(id));
    }
}
