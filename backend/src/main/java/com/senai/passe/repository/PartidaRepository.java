package com.senai.passe.repository;

import com.senai.passe.model.Partida;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PartidaRepository extends JpaRepository<Partida, Long> {
    List<Partida> findAllByOrderByJogadaEmDesc();
}
