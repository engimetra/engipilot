package com.engipilot.kafka;

import com.engipilot.dto.response.EVMResponse;
import com.engipilot.websocket.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;
import java.math.BigDecimal;
import java.util.UUID;

@Component @RequiredArgsConstructor @Slf4j
public class KpiEventConsumer {

    private final NotificationService notificationService;

    private static final double SPI_ALERT_THRESHOLD = 0.80;
    private static final double CPI_ALERT_THRESHOLD = 0.85;

    @KafkaListener(topics = KpiEventProducer.TOPIC_KPI_UPDATED, groupId = "engipilot-alertes")
    public void onKpiUpdated(EVMResponse evm) {
        log.debug("KPI reçu — projetId:{} SPI:{} CPI:{}", evm.getProjetId(), evm.getSpi(), evm.getCpi());

        if (evm.getOrgId() == null) {
            log.warn("orgId absent dans EVMResponse — projet:{}", evm.getProjetId());
            return;
        }

        if (evm.getSpi() != null && evm.getSpi().doubleValue() < SPI_ALERT_THRESHOLD) {
            notificationService.alerteIA(
                evm.getOrgId(),
                "Retard critique détecté",
                "SPI = " + evm.getSpi() + " — " + evm.getInterpretationSPI(),
                "CRITIQUE"
            );
        }

        if (evm.getCpi() != null && evm.getCpi().doubleValue() < CPI_ALERT_THRESHOLD) {
            notificationService.alerteIA(
                evm.getOrgId(),
                "Dépassement budget détecté",
                "CPI = " + evm.getCpi() + " — EAC estimé: " + evm.getEac() + "M MAD",
                "MAJEUR"
            );
        }
    }
}
