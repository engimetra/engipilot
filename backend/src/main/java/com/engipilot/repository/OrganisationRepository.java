package com.engipilot.repository;

import com.engipilot.domain.Organisation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface OrganisationRepository extends JpaRepository<Organisation, UUID> {
    Optional<Organisation> findByStripeCustomerId(String stripeCustomerId);
    Optional<Organisation> findByStripeSubscriptionId(String stripeSubscriptionId);
}
