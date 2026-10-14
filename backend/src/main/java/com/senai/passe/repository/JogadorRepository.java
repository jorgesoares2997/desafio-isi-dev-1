package com.senai.passe.repository;

import com.senai.passe.model.Jogador;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface JogadorRepository extends JpaRepository<Jogador, Long>, JpaSpecificationExecutor<Jogador> {
    Optional<Jogador> findByIdAndExcluidoEmIsNull(Long id);
    List<Jogador> findByClubeIdAndExcluidoEmIsNull(Long clubeId);
}
