package com.engipilot.service;

import com.engipilot.domain.Projet;
import com.engipilot.dto.response.EVMResponse;
import com.engipilot.repository.ProjetRepository;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.kafka.core.KafkaTemplate;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class KPIServiceTest {

    @Mock ProjetRepository projetRepository;
    @Mock KafkaTemplate<String, Object> kafkaTemplate;
    @InjectMocks KPIService kpiService;

    private static final UUID PROJET_ID = UUID.randomUUID();
    private static final UUID ORG_ID    = UUID.randomUUID();

    private Projet buildProjet(double bat, double avPhy, double avTh, double coutReel) {
        return Projet.builder()
            .id(PROJET_ID)
            .codeProjet("P-TEST-001")
            .nom("Projet Test")
            .budgetPrevisionnel(BigDecimal.valueOf(bat))
            .avancementPhysique(BigDecimal.valueOf(avPhy))
            .avancementTheorique(BigDecimal.valueOf(avTh))
            .coutReel(BigDecimal.valueOf(coutReel))
            .dateDebut(LocalDate.now().minusMonths(6))
            .dateFinPrevue(LocalDate.now().plusMonths(6))
            .statut(Projet.StatutProjet.EN_COURS)
            .organisationId(ORG_ID)
            .build();
    }

    @Test
    @DisplayName("SPI = 1.00 quand avancement physique = avancement théorique")
    void spi_egal_un_quand_avancement_identique() {
        when(projetRepository.findByIdAndOrganisationId(PROJET_ID, ORG_ID))
            .thenReturn(Optional.of(buildProjet(1_000_000, 60, 60, 600_000)));

        EVMResponse result = kpiService.calculerEVM(PROJET_ID, ORG_ID);

        assertThat(result.getSpi()).isEqualByComparingTo(BigDecimal.ONE);
        assertThat(result.getInterpretationSPI()).contains("Planning respecté");
    }

    @Test
    @DisplayName("SPI < 1 quand retard — Usine Bouskoura simulé")
    void spi_inferieur_un_quand_retard() {
        when(projetRepository.findByIdAndOrganisationId(PROJET_ID, ORG_ID))
            .thenReturn(Optional.of(buildProjet(82_000_000, 45, 63, 36_000_000)));

        EVMResponse result = kpiService.calculerEVM(PROJET_ID, ORG_ID);

        assertThat(result.getSpi()).isLessThan(BigDecimal.ONE);
        assertThat(result.getCpi()).isLessThan(BigDecimal.ONE);
        assertThat(result.getEac()).isGreaterThan(BigDecimal.valueOf(82_000_000));
        assertThat(result.getInterpretationSPI()).containsAnyOf("retard","Retard");
    }

    @Test
    @DisplayName("CPI = 1.0 quand coût réel = valeur acquise")
    void cpi_egal_un_quand_budget_respecte() {
        when(projetRepository.findByIdAndOrganisationId(PROJET_ID, ORG_ID))
            .thenReturn(Optional.of(buildProjet(1_000_000, 60, 50, 600_000)));

        EVMResponse result = kpiService.calculerEVM(PROJET_ID, ORG_ID);

        assertThat(result.getCpi()).isEqualByComparingTo(BigDecimal.ONE);
        assertThat(result.getInterpretationCPI()).contains("maîtrisé");
    }

    @Test
    @DisplayName("EAC = BAT / CPI quand CPI > 0")
    void eac_calcul_correct() {
        when(projetRepository.findByIdAndOrganisationId(PROJET_ID, ORG_ID))
            .thenReturn(Optional.of(buildProjet(1_000_000, 45, 50, 600_000)));

        EVMResponse result = kpiService.calculerEVM(PROJET_ID, ORG_ID);

        // VA = 1M * 45% = 450K, CR = 600K, CPI = 450/600 = 0.75
        // EAC = 1M / 0.75 ≈ 1.33M
        assertThat(result.getEac()).isGreaterThan(BigDecimal.valueOf(1_000_000));
        assertThat(result.getVac()).isLessThan(BigDecimal.ZERO);
    }

    @Test
    @DisplayName("Kafka publié après calcul EVM")
    void kafka_publie_apres_calcul() {
        when(projetRepository.findByIdAndOrganisationId(PROJET_ID, ORG_ID))
            .thenReturn(Optional.of(buildProjet(1_000_000, 60, 60, 600_000)));

        kpiService.calculerEVM(PROJET_ID, ORG_ID);

        verify(kafkaTemplate, times(1)).send(eq("kpi.updated"), eq(PROJET_ID.toString()), any());
    }

    @Test
    @DisplayName("Exception si projet non trouvé")
    void exception_si_projet_non_trouve() {
        when(projetRepository.findByIdAndOrganisationId(any(), any()))
            .thenReturn(Optional.empty());

        assertThatThrownBy(() -> kpiService.calculerEVM(PROJET_ID, ORG_ID))
            .hasMessageContaining("Projet non trouvé");
    }
}
