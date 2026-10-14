package com.senai.passe.repository;

import com.senai.passe.model.DueloPartida;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DueloPartidaRepository extends JpaRepository<DueloPartida, Long> {
    List<DueloPartida> findByPartidaIdOrderByOrdemAsc(Long partidaId);
}
