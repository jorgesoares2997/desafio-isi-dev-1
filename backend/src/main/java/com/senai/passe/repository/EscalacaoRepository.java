package com.senai.passe.repository;

import com.senai.passe.model.Escalacao;
import com.senai.passe.model.EscalacaoId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EscalacaoRepository extends JpaRepository<Escalacao, EscalacaoId> {
    List<Escalacao> findByIdClubeId(Long clubeId);
    void deleteByIdClubeId(Long clubeId);
    void deleteByIdJogadorId(Long jogadorId);
}
