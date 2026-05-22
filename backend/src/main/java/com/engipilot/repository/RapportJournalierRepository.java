package com.engipilot.repository;
import com.engipilot.domain.RapportJournalier;
import org.springframework.data.jpa.repository.*;
import org.springframework.stereotype.Repository;
import java.time.LocalDate;
import java.util.*;

@Repository
public interface RapportJournalierRepository extends JpaRepository<RapportJournalier, UUID> {
    List<RapportJournalier> findAllByProjetIdOrderByDateRapportDesc(UUID projetId);
    Optional<RapportJournalier> findByProjetIdAndDateRapport(UUID projetId, LocalDate date);
    boolean existsByNumeroRapport(String numero);
}
