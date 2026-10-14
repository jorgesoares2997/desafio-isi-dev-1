package com.senai.passe.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Entity
@Table(name = "clubes")
public class Clube {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String nome;

    @Column(nullable = false, unique = true, length = 10)
    private String sigla;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal caixa = new BigDecimal("300.00");

    @Column(length = 10)
    private String formacao;

    @Column(name = "criado_em", nullable = false)
    private OffsetDateTime criadoEm = OffsetDateTime.now();

    public Clube() {
    }

    public Clube(Long id, String nome, String sigla, BigDecimal caixa, String formacao, OffsetDateTime criadoEm) {
        this.id = id;
        this.nome = nome;
        this.sigla = sigla;
        this.caixa = (caixa != null) ? caixa : new BigDecimal("300.00");
        this.formacao = formacao;
        this.criadoEm = (criadoEm != null) ? criadoEm : OffsetDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getNome() {
        return nome;
    }

    public void setNome(String nome) {
        this.nome = nome;
    }

    public String getSigla() {
        return sigla;
    }

    public void setSigla(String sigla) {
        this.sigla = sigla;
    }

    public BigDecimal getCaixa() {
        return caixa;
    }

    public void setCaixa(BigDecimal caixa) {
        this.caixa = caixa;
    }

    public String getFormacao() {
        return formacao;
    }

    public void setFormacao(String formacao) {
        this.formacao = formacao;
    }

    public OffsetDateTime getCriadoEm() {
        return criadoEm;
    }

    public void setCriadoEm(OffsetDateTime criadoEm) {
        this.criadoEm = criadoEm;
    }
}
