package com.engipilot.repository;
import com.engipilot.domain.IncidentHSE;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.repository.*;
import org.springframework.stereotype.Repository;
import java.time.LocalDate;
import java.util.*;

@Repository
public interface IncidentHSERepository extends JpaRepository<IncidentHSE, UUID> {
    // version List conservée pour les calculs KPI internes
    List<IncidentHSE> findAllByProjetIdOrderByDateIncidentDesc(UUID projetId);
    Page<IncidentHSE> findAllByProjetIdOrderByDateIncidentDesc(UUID projetId, Pageable pageable);
    long countByOrganisationIdAndDateIncidentBetween(UUID orgId, LocalDate from, LocalDate to);
    long countByProjetIdAndType(UUID projetId, IncidentHSE.TypeIncident type);
}
