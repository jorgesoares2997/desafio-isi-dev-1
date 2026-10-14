package com.senai.passe.model;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.*;

import java.io.Serializable;

@Embeddable
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode
public class EscalacaoId implements Serializable {

    @Column(name = "clube_id")
    private Long clubeId;

    @Column(name = "jogador_id")
    private Long jogadorId;
}
