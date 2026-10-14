package com.senai.passe.service.dto;

public record DueloResult(
        int ordem,
        Long clubeAtacanteId,
        Long atacanteId,
        Long defensorId,
        String nomeAtacante,
        String nomeDefensor,
        String posicaoAtacante,
        String posicaoDefensor,
        String condicaoAtacante,
        String condicaoDefensor,
        String atributoAtaque,
        String atributoDefesa,
        int valorAtaque,
        int valorDefesa,
        boolean gol
) {}
