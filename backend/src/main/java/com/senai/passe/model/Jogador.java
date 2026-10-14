package com.senai.passe.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Entity
@Table(name = "jogadores")
public class Jogador {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String nome;

    @Column(nullable = false, length = 10)
    private String posicao;

    @Column(nullable = false)
    private Integer agilidade;

    @Column(nullable = false)
    private Integer idade;

    @Column(name = "valor_base", nullable = false, precision = 10, scale = 2)
    private BigDecimal valorBase;

    @Column(nullable = false, length = 20)
    private String condicao = "APTO";

    @Column(name = "clube_id")
    private Long clubeId;

    @Column(nullable = false)
    private Integer velocidade;

    @Column(nullable = false)
    private Integer finalizacao;

    @Column(nullable = false)
    private Integer passe;

    @Column(nullable = false)
    private Integer drible;

    @Column(nullable = false)
    private Integer defesa;

    @Column(nullable = false)
    private Integer fisico;

    @Column(nullable = false)
    private Integer potencial;

    @Column(name = "excluido_em")
    private OffsetDateTime excluidoEm;

    @Column(name = "criado_em", nullable = false)
    private OffsetDateTime criadoEm = OffsetDateTime.now();

    @Column(name = "atualizado_em", nullable = false)
    private OffsetDateTime atualizadoEm = OffsetDateTime.now();

    public Jogador() {
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

    public String getPosicao() {
        return posicao;
    }

    public void setPosicao(String posicao) {
        this.posicao = posicao;
    }

    public Integer getAgilidade() {
        return agilidade;
    }

    public void setAgilidade(Integer agilidade) {
        this.agilidade = agilidade;
    }

    public Integer getIdade() {
        return idade;
    }

    public void setIdade(Integer idade) {
        this.idade = idade;
    }

    public BigDecimal getValorBase() {
        return valorBase;
    }

    public void setValorBase(BigDecimal valorBase) {
        this.valorBase = valorBase;
    }

    public String getCondicao() {
        return condicao;
    }

    public void setCondicao(String condicao) {
        this.condicao = condicao;
    }

    public Long getClubeId() {
        return clubeId;
    }

    public void setClubeId(Long clubeId) {
        this.clubeId = clubeId;
    }

    public Integer getVelocidade() {
        return velocidade;
    }

    public void setVelocidade(Integer velocidade) {
        this.velocidade = velocidade;
    }

    public Integer getFinalizacao() {
        return finalizacao;
    }

    public void setFinalizacao(Integer finalizacao) {
        this.finalizacao = finalizacao;
    }

    public Integer getPasse() {
        return passe;
    }

    public void setPasse(Integer passe) {
        this.passe = passe;
    }

    public Integer getDrible() {
        return drible;
    }

    public void setDrible(Integer drible) {
        this.drible = drible;
    }

    public Integer getDefesa() {
        return defesa;
    }

    public void setDefesa(Integer defesa) {
        this.defesa = defesa;
    }

    public Integer getFisico() {
        return fisico;
    }

    public void setFisico(Integer fisico) {
        this.fisico = fisico;
    }

    public Integer getPotencial() {
        return potencial;
    }

    public void setPotencial(Integer potencial) {
        this.potencial = potencial;
    }

    public OffsetDateTime getExcluidoEm() {
        return excluidoEm;
    }

    public void setExcluidoEm(OffsetDateTime excluidoEm) {
        this.excluidoEm = excluidoEm;
    }

    public OffsetDateTime getCriadoEm() {
        return criadoEm;
    }

    public void setCriadoEm(OffsetDateTime criadoEm) {
        this.criadoEm = criadoEm;
    }

    public OffsetDateTime getAtualizadoEm() {
        return atualizadoEm;
    }

    public void setAtualizadoEm(OffsetDateTime atualizadoEm) {
        this.atualizadoEm = atualizadoEm;
    }
}
