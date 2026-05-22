package com.engipilot.dto.request;
import com.engipilot.domain.Tache.*;
import jakarta.validation.constraints.*;
import java.time.LocalDate;
import java.util.UUID;

public record TacheCreateRequest(
    @NotBlank String titre,
    String description,
    Priorite priorite,
    String responsable,
    LocalDate dateEcheance,
    UUID lotId
) {}
