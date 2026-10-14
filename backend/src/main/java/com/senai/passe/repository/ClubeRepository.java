package com.senai.passe.repository;

import com.senai.passe.model.Clube;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ClubeRepository extends JpaRepository<Clube, Long> {
    Optional<Clube> findBySigla(String sigla);
    boolean existsBySigla(String sigla);
}
