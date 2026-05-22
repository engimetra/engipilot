package com.engipilot.dto.request;
import com.engipilot.domain.Projet.*;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.LocalDate;

public record ProjetCreateRequest(
    @NotBlank String codeProjet,
    @NotBlank String nom,
    String description,
    Priorite priorite,
    @NotNull @Positive BigDecimal budgetPrevisionnel,
    @NotNull LocalDate dateDebut,
    @NotNull LocalDate dateFinPrevue,
    String ville, String client, String chefChantier
) {}
