package com.senai.passe.util;

import java.text.Normalizer;

public final class NameNormalizationUtils {

    private NameNormalizationUtils() {
    }

    /**
     * Regra geral de ordenação alfabética por nome:
     * Nomes são convertidos para minúsculas, têm acentos removidos e são comparados
     * caractere a caractere pela ordem Unicode (o espaço vem antes do hífen, e o hífen antes das letras).
     */
    public static String normalizeForComparison(String name) {
        if (name == null) {
            return "";
        }
        String normalized = Normalizer.normalize(name.trim(), Normalizer.Form.NFD);
        return normalized.replaceAll("\\p{M}", "").toLowerCase();
    }
}
