package com.engipilot.repository;
import com.engipilot.domain.NonConformite;
import org.springframework.data.jpa.repository.*;
import org.springframework.stereotype.Repository;
import java.util.*;

@Repository
public interface NonConformiteRepository extends JpaRepository<NonConformite, UUID> {
    List<NonConformite> findAllByProjetIdOrderByCreatedAtDesc(UUID projetId);
    List<NonConformite> findAllByOrganisationIdAndStatutIn(UUID orgId, List<NonConformite.Statut> statuts);
    long countByProjetIdAndStatut(UUID projetId, NonConformite.Statut statut);
}
