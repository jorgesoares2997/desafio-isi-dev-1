package com.senai.passe.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Entity
@Table(name = "contratos")
public class Contrato {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "jogador_id", nullable = false)
    private Long jogadorId;

    @Column(name = "clube_id", nullable = false)
    private Long clubeId;

    @Column(name = "valor_compra", nullable = false, precision = 10, scale = 2)
    private BigDecimal valorCompra;

    @Column(name = "fidelidade_ate", nullable = false)
    private OffsetDateTime fidelidadeAte;

    @Column(nullable = false, length = 20)
    private String situacao;

    @Column(name = "iniciado_em", nullable = false)
    private OffsetDateTime iniciadoEm = OffsetDateTime.now();

    @Column(name = "encerrado_em")
    private OffsetDateTime encerradoEm;

    public Contrato() {
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getJogadorId() {
        return jogadorId;
    }

    public void setJogadorId(Long jogadorId) {
        this.jogadorId = jogadorId;
    }

    public Long getClubeId() {
        return clubeId;
    }

    public void setClubeId(Long clubeId) {
        this.clubeId = clubeId;
    }

    public BigDecimal getValorCompra() {
        return valorCompra;
    }

    public void setValorCompra(BigDecimal valorCompra) {
        this.valorCompra = valorCompra;
    }

    public OffsetDateTime getFidelidadeAte() {
        return fidelidadeAte;
    }

    public void setFidelidadeAte(OffsetDateTime fidelidadeAte) {
        this.fidelidadeAte = fidelidadeAte;
    }

    public String getSituacao() {
        return situacao;
    }

    public void setSituacao(String situacao) {
        this.situacao = situacao;
    }

    public OffsetDateTime getIniciadoEm() {
        return iniciadoEm;
    }

    public void setIniciadoEm(OffsetDateTime iniciadoEm) {
        this.iniciadoEm = iniciadoEm;
    }

    public OffsetDateTime getEncerradoEm() {
        return encerradoEm;
    }

    public void setEncerradoEm(OffsetDateTime encerradoEm) {
        this.encerradoEm = encerradoEm;
    }
}
