package com.engipilot.domain;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.math.BigDecimal;
import java.time.*;
import java.util.*;

@Entity @Table(name="projets") @Data @Builder @NoArgsConstructor @AllArgsConstructor
public class Projet {
    @Id @GeneratedValue(strategy=GenerationType.UUID) private UUID id;
    @Column(nullable=false) private String codeProjet;
    @Column(nullable=false) private String nom;
    @Column(columnDefinition="TEXT") private String description;
    @Enumerated(EnumType.STRING) @Builder.Default private StatutProjet statut = StatutProjet.EN_COURS;
    @Enumerated(EnumType.STRING) @Builder.Default private Priorite priorite = Priorite.NORMALE;
    @Column(precision=5,scale=2) @Builder.Default private BigDecimal avancementPhysique = BigDecimal.ZERO;
    @Column(precision=5,scale=2) @Builder.Default private BigDecimal avancementTheorique = BigDecimal.ZERO;
    @Column(nullable=false,precision=15,scale=2) private BigDecimal budgetPrevisionnel;
    @Column(precision=15,scale=2) @Builder.Default private BigDecimal coutReel = BigDecimal.ZERO;
    @Column(nullable=false) private LocalDate dateDebut;
    @Column(nullable=false) private LocalDate dateFinPrevue;
    private LocalDate dateFinReelle;
    private String ville; private String client; private String chefChantier;
    @Column(nullable=false) private UUID organisationId;
    @OneToMany(mappedBy="projet",cascade=CascadeType.ALL,orphanRemoval=true) @Builder.Default
    private List<Lot> lots = new ArrayList<>();
    @CreationTimestamp private LocalDateTime createdAt;
    @UpdateTimestamp private LocalDateTime updatedAt;
    public enum StatutProjet { PLANIFIE, EN_COURS, EN_PAUSE, TERMINE, ANNULE }
    public enum Priorite { CRITIQUE, HAUTE, NORMALE, BASSE }
}
