package com.engipilot.dto.response;
import com.engipilot.domain.RapportJournalier.*;
import java.math.BigDecimal;
import java.time.*;
import java.util.UUID;

public record RapportResponse(
    UUID id, LocalDate dateRapport, String numeroRapport,
    String meteo, Integer effectifTotal, String travauxRealises,
    BigDecimal betonCouleM3, BigDecimal acierKg,
    BigDecimal avancementJournalier, String problemes,
    Statut statut, UUID projetId, LocalDateTime createdAt
) {}
