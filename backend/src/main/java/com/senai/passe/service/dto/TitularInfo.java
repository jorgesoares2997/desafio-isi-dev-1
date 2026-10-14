package com.senai.passe.service.dto;

public record TitularInfo(
        Long id,
        String nome,
        String posicao,
        String condicao,
        int velocidade,
        int finalizacao,
        int passe,
        int drible,
        int defesa,
        int fisico
) {}
