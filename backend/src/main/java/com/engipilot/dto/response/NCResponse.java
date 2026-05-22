package com.engipilot.dto.response;
import com.engipilot.domain.NonConformite.*;
import java.time.*;
import java.util.UUID;

public record NCResponse(
    UUID id, String reference, String description,
    Priorite priorite, Statut statut,
    String lot, String zone, String responsable,
    LocalDate dateConstat, LocalDate dateResolution,
    UUID projetId, LocalDateTime createdAt
) {}
