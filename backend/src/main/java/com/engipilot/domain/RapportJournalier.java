package com.engipilot.domain;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.*;
import java.util.UUID;

@Entity @Table(name="rapports_journaliers") @Data @Builder @NoArgsConstructor @AllArgsConstructor
public class RapportJournalier {
    @Id @GeneratedValue(strategy=GenerationType.UUID) private UUID id;
    @Column(nullable=false) private LocalDate dateRapport;
    @Column(nullable=false,unique=true) private String numeroRapport;
    private String meteo; private Integer temperatureCelsius; private Integer effectifTotal;
    @Column(columnDefinition="TEXT") private String travauxRealises;
    private BigDecimal betonCouleM3; private BigDecimal acierKg;
    @Column(precision=5,scale=2) private BigDecimal avancementJournalier;
    @Column(columnDefinition="TEXT") private String problemes;
    @Enumerated(EnumType.STRING) @Builder.Default private Statut statut = Statut.BROUILLON;
    @ManyToOne(fetch=FetchType.LAZY) @JoinColumn(name="projet_id") private Projet projet;
    private UUID redacteurId; private LocalDateTime createdAt;
    public enum Statut { BROUILLON, SOUMIS, VALIDE }
}
