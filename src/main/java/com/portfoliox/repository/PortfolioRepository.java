package com.portfoliox.repository;

import com.portfoliox.model.Portfolio;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface PortfolioRepository extends JpaRepository<Portfolio, Long> {
    Optional<Portfolio> findByUserId(Long userId);
    Optional<Portfolio> findByUserUsername(String username);
}
