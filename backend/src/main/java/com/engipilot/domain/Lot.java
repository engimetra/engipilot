package com.engipilot.domain;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Entity @Table(name="lots") @Data @Builder @NoArgsConstructor @AllArgsConstructor
public class Lot {
    @Id @GeneratedValue(strategy=GenerationType.UUID) private UUID id;
    @Column(nullable=false) private String code;
    @Column(nullable=false) private String nom;
    @Column(precision=5,scale=2) @Builder.Default private BigDecimal avancement = BigDecimal.ZERO;
    @Column(precision=15,scale=2) private BigDecimal budget;
    @Column(precision=15,scale=2) @Builder.Default private BigDecimal coutReel = BigDecimal.ZERO;
    private LocalDate dateDebut; private LocalDate dateFinPrevue;
    @Enumerated(EnumType.STRING) @Builder.Default private Statut statut = Statut.EN_COURS;
    @ManyToOne(fetch=FetchType.LAZY) @JoinColumn(name="projet_id") private Projet projet;
    public enum Statut { PLANIFIE, EN_COURS, RETARD, TERMINE }
}
