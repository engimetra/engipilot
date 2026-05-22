package com.engipilot.dto.response;
import com.engipilot.domain.IncidentHSE.TypeIncident;
import com.engipilot.domain.IncidentHSE.Gravite;
import com.engipilot.domain.IncidentHSE.Statut;
import java.time.*;
import java.util.UUID;

public record IncidentResponse(
    UUID id, TypeIncident type, String description,
    LocalDate dateIncident, String lieu,
    Gravite gravite, Statut statut,
    Integer nombreJoursArret, Integer nombreBlesses,
    String mesuresPrises, UUID projetId, LocalDateTime createdAt
) {}
