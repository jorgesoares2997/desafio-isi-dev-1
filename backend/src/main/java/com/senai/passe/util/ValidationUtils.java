package com.senai.passe.util;

import com.senai.passe.exception.BadRequestException;
import com.senai.passe.exception.ResourceNotFoundException;

import java.text.Normalizer;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeFormatterBuilder;
import java.time.format.ResolverStyle;
import java.time.temporal.ChronoUnit;
import java.util.regex.Pattern;

public final class ValidationUtils {

    private static final Pattern POSITIVE_INTEGER_PATTERN = Pattern.compile("^[1-9][0-9]{0,9}$");
    private static final ZoneOffset FUSO_BRASILIA = ZoneOffset.of("-03:00");

    // Formatter aceitando AAAA-MM-DDTHH:MM-03:00 ou AAAA-MM-DDTHH:MM:SS-03:00 de forma estrita
    private static final DateTimeFormatter BRASILIA_DATE_TIME_FORMATTER = new DateTimeFormatterBuilder()
            .parseCaseInsensitive()
            .append(DateTimeFormatter.ISO_LOCAL_DATE)
            .appendLiteral('T')
            .appendPattern("HH:mm")
            .optionalStart()
            .appendPattern(":ss")
            .optionalEnd()
            .appendOffset("+HH:MM", "-03:00")
            .toFormatter()
            .withResolverStyle(ResolverStyle.STRICT);

    private ValidationUtils() {
    }

    /**
     * Valida e converte ID da URL (Path Parameter). Qualquer ID inválido, zero, negativo, com zeros à esquerda
     * ou maior que Integer.MAX_VALUE deve responder 404 (Regra V8).
     */
    public static Long parsePositiveId(String idStr) {
        if (idStr == null || !POSITIVE_INTEGER_PATTERN.matcher(idStr).matches()) {
            throw new ResourceNotFoundException("Recurso não encontrado para o ID: " + idStr);
        }
        try {
            long val = Long.parseLong(idStr);
            if (val > Integer.MAX_VALUE) {
                throw new ResourceNotFoundException("ID excede limite máximo: " + idStr);
            }
            return val;
        } catch (NumberFormatException e) {
            throw new ResourceNotFoundException("ID inválido: " + idStr);
        }
    }

    /**
     * Valida e converte ID de filtro/query parameter (ex: club_id, player_id).
     * Formato inválido, zero, negativo, zeros à esquerda ou não numérico deve responder 400 (Filtro inválido).
     */
    public static Long parsePositiveFilterId(String idStr, String paramName) {
        if (idStr == null || !POSITIVE_INTEGER_PATTERN.matcher(idStr).matches()) {
            throw new BadRequestException("Parâmetro de filtro '" + paramName + "' deve ser um inteiro positivo.");
        }
        try {
            long val = Long.parseLong(idStr);
            if (val > Integer.MAX_VALUE) {
                throw new BadRequestException("Parâmetro de filtro '" + paramName + "' excede o valor máximo permitido.");
            }
            return val;
        } catch (NumberFormatException e) {
            throw new BadRequestException("Parâmetro de filtro '" + paramName + "' com formato inválido: " + idStr);
        }
    }

    /**
     * Valida e sanitiza string conforme a regra V4:
     * - Rejeita caracteres de controle com 400.
     * - Remove espaços no início e no fim.
     * - Colapsa espaços repetidos em um só.
     */
    public static String sanitizeV4(String input, String fieldName) {
        if (input == null) {
            throw new BadRequestException("Campo obrigatório ausente: " + fieldName);
        }

        for (int i = 0; i < input.length(); i++) {
            char c = input.charAt(i);
            if (Character.isISOControl(c)) {
                throw new BadRequestException("Caracteres de controle não são permitidos no campo " + fieldName + ".");
            }
        }

        String sanitized = input.trim().replaceAll("\\s+", " ");
        if (sanitized.isEmpty()) {
            throw new BadRequestException("Campo obrigatório não pode ser vazio: " + fieldName);
        }
        return sanitized;
    }

    /**
     * Validação de nome de jogador:
     * - 3 a 100 caracteres após V4.
     * - Pelo menos duas palavras (cada palavra com pelo menos uma letra).
     * - Nenhum dígito numérico (0-9).
     */
    public static String validatePlayerName(String rawName) {
        String name = sanitizeV4(rawName, "name");

        if (name.length() < 3 || name.length() > 100) {
            throw new BadRequestException("Nome do jogador deve ter entre 3 e 100 caracteres.");
        }

        for (int i = 0; i < name.length(); i++) {
            if (Character.isDigit(name.charAt(i))) {
                throw new BadRequestException("Nome do jogador não pode conter dígitos numéricos.");
            }
        }

        String[] words = name.split(" ");
        if (words.length < 2) {
            throw new BadRequestException("Nome do jogador deve conter pelo menos duas palavras.");
        }

        for (String word : words) {
            boolean hasLetter = false;
            for (int i = 0; i < word.length(); i++) {
                if (Character.isLetter(word.charAt(i))) {
                    hasLetter = true;
                    break;
                }
            }
            if (!hasLetter) {
                throw new BadRequestException("Cada palavra do nome deve conter pelo menos uma letra.");
            }
        }

        return name;
    }

    /**
     * Validação de nome de clube:
     * - 3 a 60 caracteres após V4.
     * - 2 a 5 palavras.
     * - Apenas letras (com ou sem acento), espaços, hífen e ponto.
     */
    public static String validateClubName(String rawName) {
        String name = sanitizeV4(rawName, "name");

        if (name.length() < 3 || name.length() > 60) {
            throw new BadRequestException("Nome do clube deve ter entre 3 e 60 caracteres.");
        }

        for (int i = 0; i < name.length(); i++) {
            char c = name.charAt(i);
            if (!Character.isLetter(c) && c != ' ' && c != '-' && c != '.') {
                throw new BadRequestException("Nome do clube contém caracteres inválidos: " + c);
            }
        }

        String[] words = name.split(" ");
        if (words.length < 2 || words.length > 5) {
            throw new BadRequestException("Nome do clube deve conter entre 2 e 5 palavras.");
        }

        for (String word : words) {
            boolean hasLetter = false;
            for (int i = 0; i < word.length(); i++) {
                if (Character.isLetter(word.charAt(i))) {
                    hasLetter = true;
                    break;
                }
            }
            if (!hasLetter) {
                throw new BadRequestException("Cada palavra do nome deve conter pelo menos uma letra.");
            }
        }

        return name;
    }

    /**
     * Validação de sigla de clube:
     * - Exatamente 3 letras de A a Z maiúsculas e sem acento.
     * - Não todas iguais.
     * - A primeira letra da sigla deve ser a primeira letra do nome.
     * - As 3 letras aparecem no nome do clube nessa ordem, sem diferenciar maiúsculas, minúsculas e acentos.
     */
    public static String validateClubAcronym(String acronym, String validatedClubName) {
        if (acronym == null) {
            throw new BadRequestException("Sigla do clube é obrigatória.");
        }

        if (!acronym.matches("^[A-Z]{3}$")) {
            throw new BadRequestException("Sigla deve conter exatamente 3 letras maiúsculas sem acento de A a Z.");
        }

        if (acronym.charAt(0) == acronym.charAt(1) && acronym.charAt(1) == acronym.charAt(2)) {
            throw new BadRequestException("As três letras da sigla não podem ser todas iguais.");
        }

        String cleanClubName = normalizeUnaccented(validatedClubName).toUpperCase();

        char firstLetterClub = ' ';
        for (int i = 0; i < cleanClubName.length(); i++) {
            char c = cleanClubName.charAt(i);
            if (Character.isLetter(c)) {
                firstLetterClub = c;
                break;
            }
        }

        if (acronym.charAt(0) != firstLetterClub) {
            throw new BadRequestException("A primeira letra da sigla deve corresponder à primeira letra do nome do clube.");
        }

        char c0 = acronym.charAt(0);
        char c1 = acronym.charAt(1);
        char c2 = acronym.charAt(2);

        int idx0 = cleanClubName.indexOf(c0);
        if (idx0 == -1) {
            throw new BadRequestException("A sigla deve conter letras presentes no nome do clube.");
        }

        int idx1 = cleanClubName.indexOf(c1, idx0 + 1);
        if (idx1 == -1) {
            throw new BadRequestException("A segunda letra da sigla não aparece após a primeira no nome do clube.");
        }

        int idx2 = cleanClubName.indexOf(c2, idx1 + 1);
        if (idx2 == -1) {
            throw new BadRequestException("A terceira letra da sigla não aparece após a segunda no nome do clube.");
        }

        return acronym;
    }

    /**
     * Decomposição Unicode NFD removendo marcas diacríticas (acentos e cedilha).
     */
    public static String normalizeUnaccented(String s) {
        if (s == null) {
            return "";
        }
        return Normalizer.normalize(s, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "");
    }

    /**
     * Valida data e hora no horário oficial de Brasília (RN01):
     * Formato obrigatório: AAAA-MM-DDTHH:MM-03:00 ou AAAA-MM-DDTHH:MM:SS-03:00.
     */
    public static OffsetDateTime parseBrasiliaDateTime(String rawDate) {
        if (rawDate == null || rawDate.isBlank()) {
            throw new BadRequestException("Data e hora obrigatória.");
        }

        if (!rawDate.endsWith("-03:00")) {
            throw new BadRequestException("Data e hora deve conter o fuso de Brasília (-03:00).");
        }

        try {
            return OffsetDateTime.parse(rawDate, BRASILIA_DATE_TIME_FORMATTER);
        } catch (Exception e) {
            throw new BadRequestException("Data ou hora inválida ou fora do formato da RN01: " + rawDate);
        }
    }

    /**
     * Valida fim de fidelidade da compra (RN01, RN12, RN13):
     * Deve ser estritamente posterior ao momento da compra e até 1095 dias depois.
     */
    public static void validateFutureLoyaltyUntil(OffsetDateTime loyaltyUntil, OffsetDateTime momentoCompra) {
        if (loyaltyUntil == null) {
            throw new BadRequestException("Fim da fidelidade é obrigatório.");
        }

        if (!loyaltyUntil.isAfter(momentoCompra)) {
            throw new BadRequestException("O fim da fidelidade deve ser posterior ao momento da compra.");
        }

        long daysBetween = ChronoUnit.DAYS.between(momentoCompra, loyaltyUntil);
        // Exatamente até 1095 dias
        if (daysBetween > 1095 || (daysBetween == 1095 && loyaltyUntil.isAfter(momentoCompra.plusDays(1095)))) {
            throw new BadRequestException("O fim da fidelidade não pode ultrapassar 1.095 dias a partir da compra.");
        }
    }
}
