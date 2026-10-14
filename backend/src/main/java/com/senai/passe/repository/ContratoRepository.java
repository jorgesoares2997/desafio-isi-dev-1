package com.senai.passe.repository;

import com.senai.passe.model.Contrato;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ContratoRepository extends JpaRepository<Contrato, Long> {
    Optional<Contrato> findByJogadorIdAndSituacao(Long jogadorId, String situacao);
    List<Contrato> findByClubeId(Long clubeId);
}
