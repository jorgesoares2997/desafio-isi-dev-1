package com.senai.passe.repository;

import com.senai.passe.model.Transacao;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TransacaoRepository extends JpaRepository<Transacao, Long> {
    List<Transacao> findByClubeIdOrderByCriadoEmDesc(Long clubeId);
    boolean existsByClubeIdAndJogadorIdAndTipo(Long clubeId, Long jogadorId, String tipo);
}
