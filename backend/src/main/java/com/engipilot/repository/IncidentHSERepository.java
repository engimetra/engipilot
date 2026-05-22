package com.engipilot.repository;
import com.engipilot.domain.IncidentHSE;
import org.springframework.data.jpa.repository.*;
import org.springframework.stereotype.Repository;
import java.time.LocalDate;
import java.util.*;

@Repository
public interface IncidentHSERepository extends JpaRepository<IncidentHSE, UUID> {
    List<IncidentHSE> findAllByProjetIdOrderByDateIncidentDesc(UUID projetId);
    long countByOrganisationIdAndDateIncidentBetween(UUID orgId, LocalDate from, LocalDate to);
    long countByProjetIdAndType(UUID projetId, IncidentHSE.TypeIncident type);
}
