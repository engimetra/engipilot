package com.engipilot.domain;
import jakarta.persistence.*;
import lombok.*;
import java.time.*;
import java.util.UUID;

@Entity @Table(name="incidents_hse") @Data @Builder @NoArgsConstructor @AllArgsConstructor
public class IncidentHSE {
    @Id @GeneratedValue(strategy=GenerationType.UUID) private UUID id;
    @Enumerated(EnumType.STRING) @Column(nullable=false) private TypeIncident type;
    @Column(nullable=false,columnDefinition="TEXT") private String description;
    @Column(nullable=false) private LocalDate dateIncident;
    private String lieu; private Integer nombreJoursArret; private Integer nombreBlesses;
    private String mesuresPrises; private boolean declareInspectionTravail;
    @ManyToOne(fetch=FetchType.LAZY) @JoinColumn(name="projet_id") private Projet projet;
    private UUID organisationId; private LocalDateTime createdAt;
    @Enumerated(EnumType.STRING)
    @Builder.Default
    private Gravite gravite = Gravite.MINEUR;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private Statut statut = Statut.EN_COURS;

    public enum TypeIncident { ACCIDENT_ARRET, ACCIDENT_SANS_ARRET, PRESQU_ACCIDENT, MALADIE_PRO }
    public enum Gravite       { MINEUR, MAJEUR, CRITIQUE }
    public enum Statut        { EN_COURS, RESOLUE }
}
