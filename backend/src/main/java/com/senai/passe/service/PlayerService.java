package com.senai.passe.service;

import com.senai.passe.dto.*;
import com.senai.passe.exception.BadRequestException;
import com.senai.passe.exception.BusinessRuleException;
import com.senai.passe.exception.ResourceNotFoundException;
import com.senai.passe.model.Jogador;
import com.senai.passe.repository.ClubeRepository;
import com.senai.passe.repository.EscalacaoRepository;
import com.senai.passe.repository.JogadorRepository;
import com.senai.passe.util.ValidationUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class PlayerService {

    private static final Set<String> POSICOES_VALIDAS = Set.of("GOL", "ZAG", "LAT", "MEI", "ATA");
    private static final Set<String> CONDICOES_VALIDAS = Set.of("APTO", "MAL_CONDICIONADO", "DOENTE");

    private final JogadorRepository jogadorRepository;
    private final ClubeRepository clubeRepository;
    private final EscalacaoRepository escalacaoRepository;
    private final PlayerValuationService valuationService;

    public PlayerService(JogadorRepository jogadorRepository,
                         ClubeRepository clubeRepository,
                         EscalacaoRepository escalacaoRepository,
                         PlayerValuationService valuationService) {
        this.jogadorRepository = jogadorRepository;
        this.clubeRepository = clubeRepository;
        this.escalacaoRepository = escalacaoRepository;
        this.valuationService = valuationService;
    }

    @Transactional
    public PlayerResponse createPlayer(PlayerCreateRequest req) {
        if (req == null) {
            throw new BadRequestException("Corpo da requisição ausente.");
        }

        String name = ValidationUtils.validatePlayerName(req.name());

        if (req.position() == null || !POSICOES_VALIDAS.contains(req.position())) {
            throw new BadRequestException("Posição inválida. Deve ser uma de: GOL, ZAG, LAT, MEI, ATA.");
        }

        if (req.age() == null || req.age() < 16 || req.age() > 45) {
            throw new BadRequestException("Idade deve estar entre 16 e 45 anos.");
        }

        if (req.agility() == null || req.agility() < 1 || req.agility() > 100) {
            throw new BadRequestException("Agilidade deve estar entre 1 e 100.");
        }
        if (req.age() >= 35 && req.agility() > 85) {
            throw new BadRequestException("Jogador com 35 anos ou mais pode ter no máximo 85 de agilidade.");
        }

        validateAttribute(req.pace(), "pace");
        validateAttribute(req.shooting(), "shooting");
        validateAttribute(req.passing(), "passing");
        validateAttribute(req.dribbling(), "dribbling");
        validateAttribute(req.defending(), "defending");
        validateAttribute(req.physical(), "physical");

        int somaAtributos = req.pace() + req.shooting() + req.passing() + req.dribbling() + req.defending() + req.physical();
        if (somaAtributos > 480) {
            throw new BadRequestException("A soma dos seis atributos técnicos não pode ultrapassar 480.");
        }

        int maxAtributo = Math.max(req.pace(), Math.max(req.shooting(), Math.max(req.passing(),
                Math.max(req.dribbling(), Math.max(req.defending(), req.physical())))));

        if (req.potential() == null || req.potential() < 1 || req.potential() > 99) {
            throw new BadRequestException("Potencial deve estar entre 1 e 99.");
        }
        if (req.potential() < maxAtributo) {
            throw new BadRequestException("Potencial não pode ser menor que o maior atributo técnico (" + maxAtributo + ").");
        }
        if (req.age() >= 33 && req.potential() != maxAtributo) {
            throw new BadRequestException("Para jogador com 33 anos ou mais, o potencial deve ser igual ao maior atributo (" + maxAtributo + ").");
        }

        int overall = valuationService.calcularOverall(req.position(), req.pace(), req.shooting(), req.passing(),
                req.dribbling(), req.defending(), req.physical());

        BigDecimal valorBase = valuationService.calcularValorBase(overall, req.potential(), req.age());

        Jogador jogador = new Jogador();
        jogador.setNome(name);
        jogador.setPosicao(req.position());
        jogador.setAgilidade(req.agility());
        jogador.setIdade(req.age());
        jogador.setValorBase(valorBase);
        jogador.setCondicao("APTO");
        jogador.setClubeId(null);
        jogador.setVelocidade(req.pace());
        jogador.setFinalizacao(req.shooting());
        jogador.setPasse(req.passing());
        jogador.setDrible(req.dribbling());
        jogador.setDefesa(req.defending());
        jogador.setFisico(req.physical());
        jogador.setPotencial(req.potential());
        jogador.setCriadoEm(OffsetDateTime.now());
        jogador.setAtualizadoEm(OffsetDateTime.now());

        Jogador salvo = jogadorRepository.save(jogador);

        BigDecimal marketValue = valuationService.calcularValorMercado(valorBase, "APTO", salvo.getAgilidade(), salvo.getIdade());

        return toPlayerResponse(salvo, overall, marketValue);
    }

    @Transactional(readOnly = true)
    public PlayerResponse getPlayer(Long id) {
        Jogador jogador = jogadorRepository.findByIdAndExcluidoEmIsNull(id)
                .orElseThrow(() -> new ResourceNotFoundException("Jogador não encontrado para o ID: " + id));

        int overall = valuationService.calcularOverall(jogador.getPosicao(), jogador.getVelocidade(), jogador.getFinalizacao(),
                jogador.getPasse(), jogador.getDrible(), jogador.getDefesa(), jogador.getFisico());
        BigDecimal marketValue = valuationService.calcularValorMercado(jogador.getValorBase(), jogador.getCondicao(),
                jogador.getAgilidade(), jogador.getIdade());

        return toPlayerResponse(jogador, overall, marketValue);
    }

    @Transactional(readOnly = true)
    public PagedResponse<PlayerResponse> listPlayers(String search, String position, String condition,
                                                     String freeStr, Long clubId, Integer minAge, Integer maxAge,
                                                     BigDecimal minValue, BigDecimal maxValue, String sortStr,
                                                     int page, int limit) {
        if (page < 1) {
            throw new BadRequestException("Número de página deve ser 1 ou maior.");
        }
        if (limit < 1 || limit > 50) {
            throw new BadRequestException("Limite por página deve estar entre 1 e 50.");
        }

        Boolean free = null;
        if (freeStr != null) {
            if ("true".equals(freeStr)) {
                free = true;
            } else if ("false".equals(freeStr)) {
                free = false;
            } else {
                throw new BadRequestException("Parâmetro 'free' deve ser 'true' ou 'false' com letras minúsculas.");
            }
        }

        if (Boolean.TRUE.equals(free) && clubId != null) {
            throw new BadRequestException("Combinação contraditória: 'free=true' não pode ser usado com 'club_id'.");
        }

        if (clubId != null) {
            if (!clubeRepository.existsById(clubId)) {
                throw new ResourceNotFoundException("Clube não encontrado para o ID: " + clubId);
            }
        }

        if (position != null && !POSICOES_VALIDAS.contains(position)) {
            throw new BadRequestException("Posição inválida para filtro: " + position);
        }

        if (condition != null && !CONDICOES_VALIDAS.contains(condition)) {
            throw new BadRequestException("Condição física inválida para filtro: " + condition);
        }

        if (minAge != null || maxAge != null) {
            int effMin = (minAge != null) ? minAge : 16;
            int effMax = (maxAge != null) ? maxAge : 45;
            if (effMin < 16 || effMax > 45 || effMin > effMax) {
                throw new BadRequestException("Faixa de idade inválida (16 a 45, com min_age <= max_age).");
            }
            minAge = effMin;
            maxAge = effMax;
        }

        if (minValue != null || maxValue != null) {
            BigDecimal effMin = (minValue != null) ? minValue : BigDecimal.ZERO;
            BigDecimal effMax = (maxValue != null) ? maxValue : new BigDecimal("550.00");
            if (effMin.compareTo(BigDecimal.ZERO) < 0 || effMax.compareTo(new BigDecimal("550.00")) > 0 || effMin.compareTo(effMax) > 0) {
                throw new BadRequestException("Faixa de valor de mercado inválida (0 a 550, com min_value <= max_value).");
            }
            minValue = effMin;
            maxValue = effMax;
        }

        String searchSanitized = null;
        if (search != null) {
            searchSanitized = ValidationUtils.sanitizeV4(search, "search");
            if (searchSanitized.length() < 2 || searchSanitized.length() > 100) {
                throw new BadRequestException("Parâmetro 'search' deve ter entre 2 e 100 caracteres.");
            }
        }

        List<String> sortCriteria = parseSort(sortStr);

        List<Jogador> todos = jogadorRepository.findByExcluidoEmIsNull();

        final String finalSearch = searchSanitized;
        final Integer finalMinAge = minAge;
        final Integer finalMaxAge = maxAge;
        final BigDecimal finalMinValue = minValue;
        final BigDecimal finalMaxValue = maxValue;
        final Boolean finalFree = free;

        List<PlayerResponse> filtrados = todos.stream()
                .filter(j -> {
                    if (finalSearch != null) {
                        String nomeNorm = ValidationUtils.normalizeUnaccented(j.getNome().toLowerCase());
                        String searchNorm = ValidationUtils.normalizeUnaccented(finalSearch.toLowerCase());
                        if (!nomeNorm.contains(searchNorm)) return false;
                    }
                    if (position != null && !position.equals(j.getPosicao())) return false;
                    if (condition != null && !condition.equals(j.getCondicao())) return false;
                    if (finalFree != null) {
                        if (finalFree && j.getClubeId() != null) return false;
                        if (!finalFree && j.getClubeId() == null) return false;
                    }
                    if (clubId != null) {
                        if (j.getClubeId() == null || !j.getClubeId().equals(clubId)) return false;
                    }
                    if (finalMinAge != null && finalMaxAge != null) {
                        if (j.getIdade() < finalMinAge || j.getIdade() > finalMaxAge) return false;
                    }
                    return true;
                })
                .map(j -> {
                    int overall = valuationService.calcularOverall(j.getPosicao(), j.getVelocidade(), j.getFinalizacao(),
                            j.getPasse(), j.getDrible(), j.getDefesa(), j.getFisico());
                    BigDecimal marketValue = valuationService.calcularValorMercado(j.getValorBase(), j.getCondicao(),
                            j.getAgilidade(), j.getIdade());
                    return toPlayerResponse(j, overall, marketValue);
                })
                .filter(dto -> {
                    if (finalMinValue != null && finalMaxValue != null) {
                        return dto.marketValue().compareTo(finalMinValue) >= 0 && dto.marketValue().compareTo(finalMaxValue) <= 0;
                    }
                    return true;
                })
                .sorted(buildPlayerComparator(sortCriteria))
                .collect(Collectors.toList());

        int totalItems = filtrados.size();
        int totalPages = (totalItems == 0) ? 1 : (int) Math.ceil((double) totalItems / limit);

        int fromIndex = (page - 1) * limit;
        List<PlayerResponse> pageContent;
        if (fromIndex >= totalItems) {
            pageContent = Collections.emptyList();
        } else {
            int toIndex = Math.min(fromIndex + limit, totalItems);
            pageContent = filtrados.subList(fromIndex, toIndex);
        }

        return new PagedResponse<>(pageContent, new PageMeta(page, limit, totalItems, totalPages));
    }

    @Transactional
    public PlayerResponse updatePlayer(Long id, PlayerUpdateRequest req) {
        if (req == null) {
            throw new BadRequestException("Corpo da requisição ausente.");
        }

        Jogador jogador = jogadorRepository.findByIdAndExcluidoEmIsNull(id)
                .orElseThrow(() -> new ResourceNotFoundException("Jogador não encontrado para o ID: " + id));

        String name = ValidationUtils.validatePlayerName(req.name());

        if (req.position() == null || !POSICOES_VALIDAS.contains(req.position())) {
            throw new BadRequestException("Posição inválida. Deve ser uma de: GOL, ZAG, LAT, MEI, ATA.");
        }

        if (jogador.getClubeId() != null && !jogador.getPosicao().equals(req.position())) {
            throw new BusinessRuleException("Jogador vinculado a um clube não pode mudar de posição.");
        }

        if (req.age() == null || req.age() < 16 || req.age() > 45) {
            throw new BadRequestException("Idade deve estar entre 16 e 45 anos.");
        }

        if (req.age() < jogador.getIdade()) {
            throw new BusinessRuleException("A idade do jogador não pode diminuir.");
        }

        if (req.agility() == null || req.agility() < 1 || req.agility() > 100) {
            throw new BadRequestException("Agilidade deve estar entre 1 e 100.");
        }
        if (req.age() >= 35 && req.agility() > 85) {
            throw new BadRequestException("Jogador com 35 anos ou mais pode ter no máximo 85 de agilidade.");
        }

        jogador.setNome(name);
        jogador.setPosicao(req.position());
        jogador.setIdade(req.age());
        jogador.setAgilidade(req.agility());
        jogador.setAtualizadoEm(OffsetDateTime.now());

        Jogador salvo = jogadorRepository.save(jogador);

        int overall = valuationService.calcularOverall(salvo.getPosicao(), salvo.getVelocidade(), salvo.getFinalizacao(),
                salvo.getPasse(), salvo.getDrible(), salvo.getDefesa(), salvo.getFisico());
        BigDecimal marketValue = valuationService.calcularValorMercado(salvo.getValorBase(), salvo.getCondicao(),
                salvo.getAgilidade(), salvo.getIdade());

        return toPlayerResponse(salvo, overall, marketValue);
    }

    @Transactional
    public PlayerResponse updateCondition(Long id, PlayerConditionRequest req) {
        if (req == null || req.condition() == null) {
            throw new BadRequestException("Condição física é obrigatória.");
        }

        if (!CONDICOES_VALIDAS.contains(req.condition())) {
            throw new BadRequestException("Condição física inválida: " + req.condition());
        }

        Jogador jogador = jogadorRepository.findByIdAndExcluidoEmIsNull(id)
                .orElseThrow(() -> new ResourceNotFoundException("Jogador não encontrado para o ID: " + id));

        // Enviar a condição atual devolve 200 sem alteração
        if (req.condition().equals(jogador.getCondicao())) {
            int overall = valuationService.calcularOverall(jogador.getPosicao(), jogador.getVelocidade(), jogador.getFinalizacao(),
                    jogador.getPasse(), jogador.getDrible(), jogador.getDefesa(), jogador.getFisico());
            BigDecimal marketValue = valuationService.calcularValorMercado(jogador.getValorBase(), jogador.getCondicao(),
                    jogador.getAgilidade(), jogador.getIdade());
            return toPlayerResponse(jogador, overall, marketValue);
        }

        // Transição direta de DOENTE para APTO é proibida (409)
        if ("DOENTE".equals(jogador.getCondicao()) && "APTO".equals(req.condition())) {
            throw new BusinessRuleException("Transição de DOENTE diretamente para APTO não é permitida.");
        }

        // Se passar a DOENTE e for titular, sai da escalação imediatamente (RN19)
        if ("DOENTE".equals(req.condition())) {
            escalacaoRepository.deleteByIdJogadorId(jogador.getId());
        }

        jogador.setCondicao(req.condition());
        jogador.setAtualizadoEm(OffsetDateTime.now());

        Jogador salvo = jogadorRepository.save(jogador);

        int overall = valuationService.calcularOverall(salvo.getPosicao(), salvo.getVelocidade(), salvo.getFinalizacao(),
                salvo.getPasse(), salvo.getDrible(), salvo.getDefesa(), salvo.getFisico());
        BigDecimal marketValue = valuationService.calcularValorMercado(salvo.getValorBase(), salvo.getCondicao(),
                salvo.getAgilidade(), salvo.getIdade());

        return toPlayerResponse(salvo, overall, marketValue);
    }

    @Transactional
    public void deletePlayer(Long id) {
        Jogador jogador = jogadorRepository.findByIdAndExcluidoEmIsNull(id)
                .orElseThrow(() -> new ResourceNotFoundException("Jogador não encontrado para o ID: " + id));

        if (jogador.getClubeId() != null) {
            throw new BusinessRuleException("Jogador vinculado a um clube não pode ser excluído.");
        }

        jogador.setExcluidoEm(OffsetDateTime.now());
        jogador.setAtualizadoEm(OffsetDateTime.now());
        jogadorRepository.save(jogador);
    }

    private void validateAttribute(Integer val, String fieldName) {
        if (val == null || val < 1 || val > 99) {
            throw new BadRequestException("Atributo '" + fieldName + "' deve estar entre 1 e 99.");
        }
    }

    private List<String> parseSort(String sortStr) {
        if (sortStr == null || sortStr.isBlank()) {
            return List.of("name");
        }

        String[] parts = sortStr.split(",");
        if (parts.length > 2) {
            throw new BadRequestException("Parâmetro 'sort' aceita no máximo dois critérios.");
        }

        Set<String> permitidos = Set.of("name", "value_asc", "value_desc", "age_asc", "age_desc", "position");
        Set<String> bases = new HashSet<>();
        List<String> list = new ArrayList<>();

        for (String p : parts) {
            String trimmed = p.trim();
            if (!permitidos.contains(trimmed)) {
                throw new BadRequestException("Critério de ordenação inválido: " + trimmed);
            }
            String baseField = trimmed.replace("_asc", "").replace("_desc", "");
            if (bases.contains(baseField)) {
                throw new BadRequestException("Critério de ordenação repetido: " + trimmed);
            }
            bases.add(baseField);
            list.add(trimmed);
        }

        return list;
    }

    private Comparator<PlayerResponse> buildPlayerComparator(List<String> criteria) {
        Comparator<PlayerResponse> comp = null;
        for (String c : criteria) {
            Comparator<PlayerResponse> current = getSingleComparator(c);
            comp = (comp == null) ? current : comp.thenComparing(current);
        }

        // Desempate padrão: nome e depois ID
        Comparator<PlayerResponse> desempate = Comparator
                .comparing((PlayerResponse p) -> ValidationUtils.normalizeUnaccented(p.name().toLowerCase()))
                .thenComparing(PlayerResponse::id);

        return (comp == null) ? desempate : comp.thenComparing(desempate);
    }

    private Comparator<PlayerResponse> getSingleComparator(String criterion) {
        switch (criterion) {
            case "value_asc":
                return Comparator.comparing(PlayerResponse::marketValue);
            case "value_desc":
                return Comparator.comparing(PlayerResponse::marketValue, Comparator.reverseOrder());
            case "age_asc":
                return Comparator.comparingInt(PlayerResponse::age);
            case "age_desc":
                return Comparator.comparingInt(PlayerResponse::age).reversed();
            case "position":
                return Comparator.comparingInt(p -> getPositionOrder(p.position()));
            case "name":
            default:
                return Comparator.comparing(p -> ValidationUtils.normalizeUnaccented(p.name().toLowerCase()));
        }
    }

    private int getPositionOrder(String pos) {
        if (pos == null) return 99;
        switch (pos.toUpperCase().trim()) {
            case "GOL": return 0;
            case "ZAG": return 1;
            case "LAT": return 2;
            case "MEI": return 3;
            case "ATA": return 4;
            default: return 99;
        }
    }

    public PlayerResponse toPlayerResponse(Jogador j, int overall, BigDecimal marketValue) {
        return new PlayerResponse(
                j.getId(),
                j.getNome(),
                j.getPosicao(),
                j.getAgilidade(),
                j.getIdade(),
                j.getCondicao(),
                j.getValorBase(),
                marketValue,
                j.getVelocidade(),
                j.getFinalizacao(),
                j.getPasse(),
                j.getDrible(),
                j.getDefesa(),
                j.getFisico(),
                j.getPotencial(),
                overall,
                j.getClubeId()
        );
    }
}
