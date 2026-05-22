package com.engipilot.dto.request;
import com.engipilot.domain.NonConformite.*;
import jakarta.validation.constraints.*;
import java.time.LocalDate;

public record NCCreateRequest(
    @NotBlank String description,
    Priorite priorite,
    String lot, String zone, String responsable,
    LocalDate dateConstat
) {}
