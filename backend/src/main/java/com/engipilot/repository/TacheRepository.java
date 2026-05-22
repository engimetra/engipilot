package com.engipilot.repository;
import com.engipilot.domain.Tache;
import org.springframework.data.jpa.repository.*;
import org.springframework.stereotype.Repository;
import java.util.*;

@Repository
public interface TacheRepository extends JpaRepository<Tache, UUID> {
    List<Tache> findAllByProjetIdOrderByCreatedAtDesc(UUID projetId);
    List<Tache> findAllByProjetIdAndStatut(UUID projetId, Tache.Statut statut);
}
