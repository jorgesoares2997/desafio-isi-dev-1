package com.senai.passe.model;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.*;

import java.io.Serializable;
import java.util.Objects;

@Embeddable
public class EscalacaoId implements Serializable {

    @Column(name = "clube_id")
    private Long clubeId;

    @Column(name = "jogador_id")
    private Long jogadorId;

    public EscalacaoId() {
    }

    public EscalacaoId(Long clubeId, Long jogadorId) {
        this.clubeId = clubeId;
        this.jogadorId = jogadorId;
    }

    public Long getClubeId() {
        return clubeId;
    }

    public void setClubeId(Long clubeId) {
        this.clubeId = clubeId;
    }

    public Long getJogadorId() {
        return jogadorId;
    }

    public void setJogadorId(Long jogadorId) {
        this.jogadorId = jogadorId;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        EscalacaoId that = (EscalacaoId) o;
        return Objects.equals(clubeId, that.clubeId) && Objects.equals(jogadorId, that.jogadorId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(clubeId, jogadorId);
    }
}
