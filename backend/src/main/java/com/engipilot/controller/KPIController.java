package com.engipilot.controller;

import com.engipilot.dto.response.EVMResponse;
import com.engipilot.service.KPIService;
import com.engipilot.security.SecurityUtils;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/kpis")
@RequiredArgsConstructor
@Tag(name = "KPIs", description = "Indicateurs de performance EVM")
public class KPIController {

    private final KPIService kpiService;

    @GetMapping("/projets/{projetId}/evm")
    @Operation(summary = "Calculer les KPIs EVM complets pour un projet")
    public ResponseEntity<EVMResponse> getEVM(@PathVariable UUID projetId) {
        return ResponseEntity.ok(kpiService.calculerEVM(projetId, SecurityUtils.getCurrentOrganisationId()));
    }
}
