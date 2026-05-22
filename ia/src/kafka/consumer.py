"""Consumer Kafka ENGIPILOT — Traitement événements KPI en temps réel."""
import asyncio
import json
import logging
import os
from aiokafka import AIOKafkaConsumer
from ..api.routers.predictions import predire
from ..api.routers.anomalies import detecter

log = logging.getLogger("ENGIPILOT-Kafka")
KAFKA_SERVERS = os.getenv("KAFKA_BOOTSTRAP_SERVERS", "localhost:9092")

async def consume_kpi_events():
    """Consomme les événements kpi.updated et déclenche les prédictions IA."""
    consumer = AIOKafkaConsumer(
        "kpi.updated",
        bootstrap_servers=KAFKA_SERVERS,
        group_id="engipilot-ia",
        value_deserializer=lambda m: json.loads(m.decode("utf-8"))
    )
    await consumer.start()
    log.info("Kafka consumer démarré — topic: kpi.updated")

    try:
        async for msg in consumer:
            try:
                kpi_data = msg.value
                projet_id = kpi_data.get("projetId")
                log.info(f"KPI reçu — projetId:{projet_id}")
                # Ici: déclencher les prédictions et publier les alertes
                # prediction = predire(KPIInput(**kpi_data))
                # if prediction.retard_predit_jours > 30:
                #     await publish_alerte(projet_id, prediction)
            except Exception as e:
                log.error(f"Erreur traitement message Kafka: {e}")
    finally:
        await consumer.stop()

if __name__ == "__main__":
    asyncio.run(consume_kpi_events())
