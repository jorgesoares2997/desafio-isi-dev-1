package com.senai.passe.model;

import jakarta.persistence.*;
import java.time.OffsetDateTime;

@Entity
@Table(name = "escalacoes")
public class Escalacao {

    @EmbeddedId
    private EscalacaoId id;

    @Column(name = "criado_em", nullable = false)
    private OffsetDateTime criadoEm = OffsetDateTime.now();

    public Escalacao() {
    }

    public Escalacao(EscalacaoId id, OffsetDateTime criadoEm) {
        this.id = id;
        this.criadoEm = (criadoEm != null) ? criadoEm : OffsetDateTime.now();
    }

    public Escalacao(Long clubeId, Long jogadorId) {
        this.id = new EscalacaoId(clubeId, jogadorId);
        this.criadoEm = OffsetDateTime.now();
    }

    public EscalacaoId getId() {
        return id;
    }

    public void setId(EscalacaoId id) {
        this.id = id;
    }

    public OffsetDateTime getCriadoEm() {
        return criadoEm;
    }

    public void setCriadoEm(OffsetDateTime criadoEm) {
        this.criadoEm = criadoEm;
    }
}
