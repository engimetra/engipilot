package com.engipilot.dto.response;
import com.engipilot.domain.Projet.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.*;
import java.util.UUID;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class ProjetResponse {
    private UUID id;
    private String codeProjet, nom, description;
    private StatutProjet statut;
    private Priorite priorite;
    private BigDecimal avancementPhysique, avancementTheorique;
    private BigDecimal budgetPrevisionnel, coutReel;
    private LocalDate dateDebut, dateFinPrevue, dateFinReelle;
    private String ville, client, chefChantier;
    private LocalDateTime createdAt;
}
