package com.engipilot.kafka;

import com.engipilot.dto.response.EVMResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;
import java.util.Map;
import java.util.UUID;

@Component @RequiredArgsConstructor @Slf4j
public class KpiEventProducer {

    private final KafkaTemplate<String, Object> kafkaTemplate;

    public static final String TOPIC_KPI_UPDATED   = "kpi.updated";
    public static final String TOPIC_ALERTE_CREATED = "alerte.created";
    public static final String TOPIC_INCIDENT_HSE   = "incident.hse";

    public void publishKpiUpdated(UUID projetId, EVMResponse evm) {
        kafkaTemplate.send(TOPIC_KPI_UPDATED, projetId.toString(), evm);
        log.info("Kafka → {} projetId:{}", TOPIC_KPI_UPDATED, projetId);
    }

    public void publishAlerte(UUID projetId, String type, String message) {
        kafkaTemplate.send(TOPIC_ALERTE_CREATED, projetId.toString(),
            Map.of("projetId", projetId, "type", type, "message", message));
    }

    public void publishIncidentHSE(UUID projetId, String description) {
        kafkaTemplate.send(TOPIC_INCIDENT_HSE, projetId.toString(),
            Map.of("projetId", projetId, "description", description));
    }
}
