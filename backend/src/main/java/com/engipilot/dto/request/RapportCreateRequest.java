package com.engipilot.dto.request;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.LocalDate;

public record RapportCreateRequest(
    @NotNull LocalDate dateRapport,
    String meteo,
    Integer temperatureCelsius,
    Integer effectifTotal,
    String travauxRealises,
    BigDecimal betonCouleM3,
    BigDecimal acierKg,
    BigDecimal avancementJournalier,
    String problemes
) {}
