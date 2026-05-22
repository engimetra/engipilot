package com.engipilot.repository;
import com.engipilot.domain.Projet;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.repository.*;
import org.springframework.stereotype.Repository;
import java.util.*;

@Repository
public interface ProjetRepository extends JpaRepository<Projet, UUID> {
    Page<Projet> findAllByOrganisationId(UUID organisationId, Pageable pageable);
    Optional<Projet> findByIdAndOrganisationId(UUID id, UUID organisationId);
    Optional<Projet> findByCodeProjetAndOrganisationId(String code, UUID orgId);
    @Query("SELECT p FROM Projet p WHERE p.organisationId = :orgId AND p.statut = 'EN_COURS'")
    Page<Projet> findEnCoursByOrganisation(UUID orgId, Pageable pageable);
    boolean existsByCodeProjetAndOrganisationId(String code, UUID orgId);
}
