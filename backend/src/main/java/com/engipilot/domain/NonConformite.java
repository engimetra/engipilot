package com.engipilot.domain;
import jakarta.persistence.*;
import lombok.*;
import java.time.*;
import java.util.UUID;

@Entity @Table(name="non_conformites") @Data @Builder @NoArgsConstructor @AllArgsConstructor
public class NonConformite {
    @Id @GeneratedValue(strategy=GenerationType.UUID) private UUID id;
    @Column(nullable=false,unique=true) private String reference;
    @Column(nullable=false,columnDefinition="TEXT") private String description;
    @Enumerated(EnumType.STRING) @Builder.Default private Priorite priorite = Priorite.MINEURE;
    @Enumerated(EnumType.STRING) @Builder.Default private Statut statut = Statut.OUVERTE;
    private String lot; private String zone; private String responsable;
    private LocalDate dateConstat; private LocalDate dateResolution;
    @Column(columnDefinition="TEXT") private String actionsCorrectivs;
    @ManyToOne(fetch=FetchType.LAZY) @JoinColumn(name="projet_id") private Projet projet;
    private UUID organisationId;
    private LocalDateTime createdAt;
    public enum Priorite { CRITIQUE, MAJEURE, MINEURE }
    public enum Statut { OUVERTE, EN_COURS, RESOLUE, FERMEE }
}
