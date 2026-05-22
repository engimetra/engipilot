package com.engipilot.controller;

import com.engipilot.dto.request.ProjetCreateRequest;
import com.engipilot.dto.response.EVMResponse;
import com.engipilot.dto.response.ProjetResponse;
import com.engipilot.service.KPIService;
import com.engipilot.service.ProjetService;
import com.engipilot.util.SecurityUtils;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/projets")
@RequiredArgsConstructor
@Tag(name = "Projets", description = "Gestion des projets de chantier BTP")
public class ProjetController {

    private final ProjetService projetService;
    private final KPIService kpiService;

    @GetMapping
    @Operation(summary = "Liste tous les projets de l'organisation")
    public ResponseEntity<Page<ProjetResponse>> lister(
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size,
        @RequestParam(required = false) String statut) {
        return ResponseEntity.ok(projetService.lister(page, size, statut));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Détail d'un projet")
    public ResponseEntity<ProjetResponse> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(projetService.getById(id));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('CHEF_PROJET') or hasRole('ADMIN')")
    @Operation(summary = "Créer un nouveau projet")
    public ResponseEntity<ProjetResponse> creer(@Valid @RequestBody ProjetCreateRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(projetService.creer(req));
    }

    @PatchMapping("/{id}/avancement")
    @Operation(summary = "Mettre à jour l'avancement physique")
    public ResponseEntity<ProjetResponse> updateAvancement(
        @PathVariable UUID id,
        @RequestParam double avancement) {
        return ResponseEntity.ok(projetService.updateAvancement(id, avancement));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Mettre à jour un projet")
    public ResponseEntity<ProjetResponse> mettreAJour(
        @PathVariable UUID id,
        @Valid @RequestBody ProjetCreateRequest req) {
        return ResponseEntity.ok(projetService.mettreAJour(id, req));
    }

    @GetMapping("/{id}/kpis/evm")
    @Operation(summary = "Calculer les KPIs EVM complets — SPI, CPI, EAC, TCPI...")
    public ResponseEntity<EVMResponse> getEVM(@PathVariable UUID id) {
        return ResponseEntity.ok(kpiService.calculerEVM(id, SecurityUtils.getCurrentOrganisationId()));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> supprimer(@PathVariable UUID id) {
        projetService.supprimer(id);
        return ResponseEntity.noContent().build();
    }
}
