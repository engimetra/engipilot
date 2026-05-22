package com.engipilot.dto.request;
import com.engipilot.domain.IncidentHSE.*;
import jakarta.validation.constraints.*;
import java.time.LocalDate;

public record IncidentCreateRequest(
    @NotNull TypeIncident type,
    @NotBlank String description,
    @NotNull LocalDate dateIncident,
    String lieu,
    Gravite gravite,
    Integer nombreJoursArret,
    Integer nombreBlesses,
    String mesuresPrises
) {}
