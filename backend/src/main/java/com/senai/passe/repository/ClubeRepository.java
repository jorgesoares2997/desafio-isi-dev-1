package com.senai.passe.repository;

import com.senai.passe.model.Clube;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ClubeRepository extends JpaRepository<Clube, Long> {
    Optional<Clube> findBySigla(String sigla);
    boolean existsBySigla(String sigla);

    @Query("SELECT COUNT(c) > 0 FROM Clube c WHERE LOWER(TRIM(c.nome)) = LOWER(TRIM(:nome))")
    boolean existsByNomeCaseInsensitive(@Param("nome") String nome);
}
