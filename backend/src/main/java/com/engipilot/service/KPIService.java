package com.engipilot.service;

import com.engipilot.domain.Projet;
import com.engipilot.dto.response.EVMResponse;
import com.engipilot.exception.ResourceNotFoundException;
import com.engipilot.repository.ProjetRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.UUID;

/**
 * Calcul des KPIs Earned Value Management (EVM).
 * Formules : SPI=VA/VP · CPI=VA/CR · EAC=BAT/CPI · TCPI=(BAT-VA)/(BAT-CR)
 */
@Service @RequiredArgsConstructor @Slf4j
public class KPIService {

    private final ProjetRepository projetRepository;
    private final KafkaTemplate<String, Object> kafkaTemplate;

    public EVMResponse calculerEVM(UUID projetId, UUID organisationId) {
        Projet p = projetRepository.findByIdAndOrganisationId(projetId, organisationId)
            .orElseThrow(() -> new ResourceNotFoundException("Projet", projetId));

        BigDecimal bat = p.getBudgetPrevisionnel();
        BigDecimal cr  = p.getCoutReel();
        BigDecimal va  = bat.multiply(p.getAvancementPhysique()).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
        BigDecimal vp  = bat.multiply(p.getAvancementTheorique()).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);

        BigDecimal spi  = div(va, vp);
        BigDecimal cpi  = div(va, cr);
        BigDecimal sv   = va.subtract(vp);
        BigDecimal cv   = va.subtract(cr);
        BigDecimal eac  = cpi.compareTo(BigDecimal.ZERO) > 0 ? bat.divide(cpi, 2, RoundingMode.HALF_UP) : bat;
        BigDecimal etc  = eac.subtract(cr);
        BigDecimal vac  = bat.subtract(eac);
        BigDecimal tcpi = div(bat.subtract(va), bat.subtract(cr));

        var result = EVMResponse.builder()
            .projetId(projetId).orgId(organisationId).bat(bat).va(va).vp(vp).cr(cr)
            .spi(spi).cpi(cpi).sv(sv).cv(cv)
            .eac(eac).etc(etc).vac(vac).tcpi(tcpi)
            .interpretationSPI(interpreterSPI(spi))
            .interpretationCPI(interpreterCPI(cpi))
            .niveauAlerte(niveauAlerte(spi, cpi))
            .build();

        kafkaTemplate.send("kpi.updated", projetId.toString(), result);
        log.info("EVM calculé — Projet:{} SPI:{} CPI:{}", projetId, spi, cpi);
        return result;
    }

    private BigDecimal div(BigDecimal num, BigDecimal den) {
        return den.compareTo(BigDecimal.ZERO) > 0
            ? num.divide(den, 3, RoundingMode.HALF_UP) : BigDecimal.ONE;
    }

    private String interpreterSPI(BigDecimal spi) {
        double v = spi.doubleValue();
        if (v >= 1.05) return "En avance sur le planning";
        if (v >= 0.95) return "Planning respecté";
        if (v >= 0.80) return "Retard modéré — surveillance";
        return "Retard critique — action urgente";
    }

    private String interpreterCPI(BigDecimal cpi) {
        double v = cpi.doubleValue();
        if (v >= 1.05) return "Sous budget";
        if (v >= 0.95) return "Budget maîtrisé";
        if (v >= 0.80) return "Dépassement modéré";
        return "Dépassement sévère — révision BAT";
    }

    private String niveauAlerte(BigDecimal spi, BigDecimal cpi) {
        double s = spi.doubleValue();
        double c = cpi.doubleValue();
        if (s < 0.80 || c < 0.80) return "CRITIQUE";
        if (s < 0.95 || c < 0.95) return "ALERTE";
        return "NORMAL";
    }
}
