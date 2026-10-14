package com.senai.passe.model;

import jakarta.persistence.*;
import java.time.OffsetDateTime;

@Entity
@Table(name = "partidas")
public class Partida {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "mandante_id", nullable = false)
    private Long mandanteId;

    @Column(name = "visitante_id", nullable = false)
    private Long visitanteId;

    @Column(name = "gols_mandante", nullable = false)
    private Integer golsMandante;

    @Column(name = "gols_visitante", nullable = false)
    private Integer golsVisitante;

    @Column(name = "formacao_mandante", nullable = false, length = 10)
    private String formacaoMandante;

    @Column(name = "formacao_visitante", nullable = false, length = 10)
    private String formacaoVisitante;

    @Column(name = "jogada_em", nullable = false)
    private OffsetDateTime jogadaEm = OffsetDateTime.now();

    public Partida() {
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getMandanteId() {
        return mandanteId;
    }

    public void setMandanteId(Long mandanteId) {
        this.mandanteId = mandanteId;
    }

    public Long getVisitanteId() {
        return visitanteId;
    }

    public void setVisitanteId(Long visitanteId) {
        this.visitanteId = visitanteId;
    }

    public Integer getGolsMandante() {
        return golsMandante;
    }

    public void setGolsMandante(Integer golsMandante) {
        this.golsMandante = golsMandante;
    }

    public Integer getGolsVisitante() {
        return golsVisitante;
    }

    public void setGolsVisitante(Integer golsVisitante) {
        this.golsVisitante = golsVisitante;
    }

    public String getFormacaoMandante() {
        return formacaoMandante;
    }

    public void setFormacaoMandante(String formacaoMandante) {
        this.formacaoMandante = formacaoMandante;
    }

    public String getFormacaoVisitante() {
        return formacaoVisitante;
    }

    public void setFormacaoVisitante(String formacaoVisitante) {
        this.formacaoVisitante = formacaoVisitante;
    }

    public OffsetDateTime getJogadaEm() {
        return jogadaEm;
    }

    public void setJogadaEm(OffsetDateTime jogadaEm) {
        this.jogadaEm = jogadaEm;
    }
}
