package com.engipilot.domain;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.*;
import java.util.UUID;

@Entity @Table(name="taches") @Data @Builder @NoArgsConstructor @AllArgsConstructor
public class Tache {
    @Id @GeneratedValue(strategy=GenerationType.UUID) private UUID id;
    @Column(nullable=false) private String titre;
    @Column(columnDefinition="TEXT") private String description;
    @Enumerated(EnumType.STRING) @Builder.Default private Statut statut = Statut.A_FAIRE;
    @Enumerated(EnumType.STRING) @Builder.Default private Priorite priorite = Priorite.NORMALE;
    private String responsable; private LocalDate dateEcheance;
    @Column(precision=5,scale=2) @Builder.Default private BigDecimal avancement = BigDecimal.ZERO;
    private UUID projetId; private UUID lotId;
    private LocalDateTime createdAt;
    public enum Statut { A_FAIRE, EN_COURS, CONTROLE_QUALITE, TERMINE }
    public enum Priorite { CRITIQUE, HAUTE, NORMALE, BASSE }
}
