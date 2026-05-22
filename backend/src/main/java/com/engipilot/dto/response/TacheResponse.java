package com.engipilot.dto.response;
import com.engipilot.domain.Tache.*;
import java.math.BigDecimal;
import java.time.*;
import java.util.UUID;

public record TacheResponse(
    UUID id, String titre, String description,
    Statut statut, Priorite priorite,
    String responsable, LocalDate dateEcheance,
    BigDecimal avancement, UUID projetId, UUID lotId,
    LocalDateTime createdAt
) {}
