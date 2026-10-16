package com.senai.passe.service;

import com.senai.passe.dto.*;
import com.senai.passe.exception.BadRequestException;
import com.senai.passe.exception.BusinessRuleException;
import com.senai.passe.exception.ResourceNotFoundException;
import com.senai.passe.model.Clube;
import com.senai.passe.model.Contrato;
import com.senai.passe.model.Jogador;
import com.senai.passe.model.Transacao;
import com.senai.passe.repository.ClubeRepository;
import com.senai.passe.repository.ContratoRepository;
import com.senai.passe.repository.EscalacaoRepository;
import com.senai.passe.repository.JogadorRepository;
import com.senai.passe.repository.TransacaoRepository;
import com.senai.passe.service.dto.LiquidacaoVendaResult;
import com.senai.passe.service.dto.TaxaCompraResult;
import com.senai.passe.util.ValidationUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.OffsetDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class MarketService {

    private static final DateTimeFormatter ISO_BRASILIA_SECONDS = DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ssXXX");

    private final ClubeRepository clubeRepository;
    private final JogadorRepository jogadorRepository;
    private final ContratoRepository contratoRepository;
    private final TransacaoRepository transacaoRepository;
    private final EscalacaoRepository escalacaoRepository;
    private final PlayerValuationService valuationService;
    private final MarketFinancialService financialService;

    public MarketService(ClubeRepository clubeRepository,
                         JogadorRepository jogadorRepository,
                         ContratoRepository contratoRepository,
                         TransacaoRepository transacaoRepository,
                         EscalacaoRepository escalacaoRepository,
                         PlayerValuationService valuationService,
                         MarketFinancialService financialService) {
        this.clubeRepository = clubeRepository;
        this.jogadorRepository = jogadorRepository;
        this.contratoRepository = contratoRepository;
        this.transacaoRepository = transacaoRepository;
        this.escalacaoRepository = escalacaoRepository;
        this.valuationService = valuationService;
        this.financialService = financialService;
    }

    @Transactional
    public BuyResponse buyPlayer(Long playerId, BuyPlayerRequest req) {
        if (req == null) {
            throw new BadRequestException("Corpo da requisição ausente.");
        }

        if (req.clubId() == null || req.clubId() <= 0) {
            throw new BadRequestException("ID do clube comprador é obrigatório e deve ser positivo.");
        }

        Clube clube = clubeRepository.findById(req.clubId())
                .orElseThrow(() -> new ResourceNotFoundException("Clube não encontrado para o ID: " + req.clubId()));

        Jogador jogador = jogadorRepository.findByIdAndExcluidoEmIsNull(playerId)
                .orElseThrow(() -> new ResourceNotFoundException("Jogador não encontrado para o ID: " + playerId));

        OffsetDateTime momentoCompra = OffsetDateTime.now();
        OffsetDateTime fidelidadeAte = ValidationUtils.parseBrasiliaDateTime(req.loyaltyUntil());
        ValidationUtils.validateFutureLoyaltyUntil(fidelidadeAte, momentoCompra);

        if (jogador.getClubeId() != null) {
            throw new BusinessRuleException("Jogador já possui clube e não está livre no mercado.");
        }

        long tamanhoElenco = jogadorRepository.countByClubeIdAndExcluidoEmIsNull(clube.getId());
        if (tamanhoElenco >= 12) {
            throw new BusinessRuleException(String.format("O elenco do %s já tem 12 jogadores, o limite da liga.", clube.getNome()));
        }

        boolean jaVendeu = transacaoRepository.existsByClubeIdAndJogadorIdAndTipo(clube.getId(), jogador.getId(), "VENDA");
        if (jaVendeu) {
            throw new BusinessRuleException(String.format("O %s já vendeu o %s e não pode comprá-lo de novo.", clube.getNome(), jogador.getNome()));
        }

        BigDecimal marketValue = valuationService.calcularValorMercado(
                jogador.getValorBase(), jogador.getCondicao(), jogador.getAgilidade(), jogador.getIdade());

        TaxaCompraResult taxaResult = financialService.calcularTaxaCompra(marketValue, clube.getCaixa());
        if (!taxaResult.permitido()) {
            throw new BusinessRuleException(String.format(
                    "O custo da compra (%s) passa do limite de 50%% do caixa (%s).",
                    taxaResult.custoTotal().toPlainString().replace('.', ','),
                    taxaResult.limite50Caixa().setScale(2, RoundingMode.HALF_UP).toPlainString().replace('.', ',')
            ));
        }

        BigDecimal novoCaixa = clube.getCaixa().subtract(taxaResult.custoTotal()).setScale(2, RoundingMode.HALF_UP);
        clube.setCaixa(novoCaixa);
        clubeRepository.save(clube);

        jogador.setClubeId(clube.getId());
        jogador.setAtualizadoEm(momentoCompra);
        jogadorRepository.save(jogador);

        Contrato contrato = new Contrato();
        contrato.setJogadorId(jogador.getId());
        contrato.setClubeId(clube.getId());
        contrato.setValorCompra(marketValue);
        contrato.setFidelidadeAte(fidelidadeAte);
        contrato.setSituacao("ATIVO");
        contrato.setIniciadoEm(momentoCompra);
        Contrato contratoSalvo = contratoRepository.save(contrato);

        Transacao transacao = new Transacao();
        transacao.setClubeId(clube.getId());
        transacao.setJogadorId(jogador.getId());
        transacao.setNomeJogador(jogador.getNome());
        transacao.setTipo("COMPRA");
        transacao.setValor(marketValue);
        transacao.setTaxa(taxaResult.taxa());
        transacao.setMulta(BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP));
        transacao.setLucro(null);
        transacao.setVariacaoCaixa(taxaResult.custoTotal().negate());
        transacao.setCriadoEm(momentoCompra);
        Transacao transacaoSalva = transacaoRepository.save(transacao);

        return new BuyResponse(
                transacaoSalva.getId(),
                clube.getId(),
                jogador.getId(),
                jogador.getNome(),
                "COMPRA",
                marketValue,
                taxaResult.taxa(),
                BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP),
                null,
                taxaResult.custoTotal().negate(),
                momentoCompra,
                new ContractSummaryResponse(marketValue, fidelidadeAte, "ATIVO"),
                novoCaixa
        );
    }

    @Transactional
    public SellResponse sellPlayer(Long playerId) {
        Jogador jogador = jogadorRepository.findByIdAndExcluidoEmIsNull(playerId)
                .orElseThrow(() -> new ResourceNotFoundException("Jogador não encontrado para o ID: " + playerId));

        if (jogador.getClubeId() == null) {
            throw new BusinessRuleException(String.format("%s já está livre e não pode ser vendido.", jogador.getNome()));
        }

        Clube clube = clubeRepository.findById(jogador.getClubeId())
                .orElseThrow(() -> new ResourceNotFoundException("Clube associado não encontrado: " + jogador.getClubeId()));

        Contrato contrato = contratoRepository.findByJogadorIdAndSituacao(jogador.getId(), "ATIVO")
                .orElseThrow(() -> new BusinessRuleException("Contrato ativo não encontrado para o jogador."));

        OffsetDateTime momentoVenda = OffsetDateTime.now();

        BigDecimal marketValue = valuationService.calcularValorMercado(
                jogador.getValorBase(), jogador.getCondicao(), jogador.getAgilidade(), jogador.getIdade());

        LiquidacaoVendaResult liq = financialService.calcularLiquidacaoVenda(
                marketValue, contrato.getValorCompra(), contrato.getFidelidadeAte(), momentoVenda);

        BigDecimal novoCaixa = clube.getCaixa().add(liq.creditoCaixa()).setScale(2, RoundingMode.HALF_UP);
        clube.setCaixa(novoCaixa);
        clubeRepository.save(clube);

        jogador.setClubeId(null);
        jogador.setAtualizadoEm(momentoVenda);
        jogadorRepository.save(jogador);

        // Remove imediatamente de escalação ativa (RN19)
        escalacaoRepository.deleteByIdJogadorId(jogador.getId());

        contrato.setSituacao(liq.situacaoContrato());
        contrato.setEncerradoEm(momentoVenda);
        contratoRepository.save(contrato);

        Transacao transacao = new Transacao();
        transacao.setClubeId(clube.getId());
        transacao.setJogadorId(jogador.getId());
        transacao.setNomeJogador(jogador.getNome());
        transacao.setTipo("VENDA");
        transacao.setValor(marketValue);
        transacao.setTaxa(liq.comissao());
        transacao.setMulta(liq.multa());
        transacao.setLucro(liq.lucro());
        transacao.setVariacaoCaixa(liq.creditoCaixa());
        transacao.setCriadoEm(momentoVenda);
        Transacao transacaoSalva = transacaoRepository.save(transacao);

        int penaltyRate = liq.percentualMulta().multiply(new BigDecimal("100")).intValue();

        return new SellResponse(
                transacaoSalva.getId(),
                clube.getId(),
                jogador.getId(),
                jogador.getNome(),
                "VENDA",
                marketValue,
                liq.comissao(),
                liq.multa(),
                liq.lucro(),
                liq.creditoCaixa(),
                momentoVenda,
                contrato.getValorCompra(),
                liq.diasRestantes(),
                penaltyRate,
                liq.situacaoContrato(),
                novoCaixa
        );
    }

    @Transactional(readOnly = true)
    public TransactionsListResponse listTransactions(Long clubId, String typeFilter, String playerIdFilter) {
        if (!clubeRepository.existsById(clubId)) {
            throw new ResourceNotFoundException("Clube não encontrado para o ID: " + clubId);
        }

        Long playerId = null;
        if (playerIdFilter != null) {
            playerId = ValidationUtils.parsePositiveId(playerIdFilter);
            if (!jogadorRepository.findByIdAndExcluidoEmIsNull(playerId).isPresent()) {
                throw new ResourceNotFoundException("Jogador não encontrado.");
            }
        }

        Set<String> types = parseTypes(typeFilter);

        List<Transacao> todas = transacaoRepository.findByClubeIdOrderByCriadoEmDescIdDesc(clubId);

        final Long finalPlayerId = playerId;
        List<Transacao> filtradas = todas.stream()
                .filter(t -> {
                    if (types != null && !types.contains(t.getTipo())) return false;
                    if (finalPlayerId != null && !finalPlayerId.equals(t.getJogadorId())) return false;
                    return true;
                })
                .collect(Collectors.toList());

        BigDecimal totalSpent = BigDecimal.ZERO;
        BigDecimal totalReceived = BigDecimal.ZERO;
        BigDecimal totalFees = BigDecimal.ZERO;
        BigDecimal totalPenalties = BigDecimal.ZERO;
        BigDecimal totalProfit = BigDecimal.ZERO;

        List<TransactionResponse> data = new ArrayList<>();
        for (Transacao t : filtradas) {
            data.add(new TransactionResponse(
                    t.getId(),
                    t.getClubeId(),
                    t.getJogadorId(),
                    t.getNomeJogador(),
                    t.getTipo(),
                    t.getValor(),
                    t.getTaxa(),
                    t.getMulta(),
                    t.getLucro(),
                    t.getVariacaoCaixa(),
                    t.getCriadoEm()
            ));

            if ("COMPRA".equals(t.getTipo())) {
                totalSpent = totalSpent.add(t.getValor().add(t.getTaxa()));
            } else if ("VENDA".equals(t.getTipo())) {
                totalReceived = totalReceived.add(t.getVariacaoCaixa());
                totalPenalties = totalPenalties.add(t.getMulta());
                if (t.getLucro() != null) {
                    totalProfit = totalProfit.add(t.getLucro());
                }
            }
            totalFees = totalFees.add(t.getTaxa());
        }

        TransactionsSummary summary = new TransactionsSummary(
                totalSpent.setScale(2, RoundingMode.HALF_UP),
                totalReceived.setScale(2, RoundingMode.HALF_UP),
                totalFees.setScale(2, RoundingMode.HALF_UP),
                totalPenalties.setScale(2, RoundingMode.HALF_UP),
                totalProfit.setScale(2, RoundingMode.HALF_UP)
        );

        return new TransactionsListResponse(data, summary);
    }

    @Transactional(readOnly = true)
    public String exportTransactionsCsv(Long clubId, String typeFilter, String playerIdFilter) {
        TransactionsListResponse resp = listTransactions(clubId, typeFilter, playerIdFilter);

        StringBuilder sb = new StringBuilder();
        sb.append("data_hora;tipo;jogador;valor;taxa_ou_comissao;multa;lucro;variacao_caixa\n");

        for (TransactionResponse t : resp.data()) {
            sb.append(t.createdAt().format(ISO_BRASILIA_SECONDS)).append(';');
            sb.append(t.type()).append(';');
            sb.append(escapeCsvName(t.playerName())).append(';');
            sb.append(formatCurrencyCsv(t.value())).append(';');
            sb.append(formatCurrencyCsv(t.fee())).append(';');
            sb.append(formatCurrencyCsv(t.penalty())).append(';');
            sb.append(t.profit() != null ? formatCurrencyCsv(t.profit()) : "").append(';');
            sb.append(formatCurrencyCsv(t.cashChange())).append('\n');
        }

        return sb.toString();
    }

    private String escapeCsvName(String name) {
        if (name == null) return "";
        if (name.contains(";") || name.contains("\"")) {
            return "\"" + name.replace("\"", "\"\"") + "\"";
        }
        return name;
    }

    private String formatCurrencyCsv(BigDecimal val) {
        if (val == null) return "";
        return val.setScale(2, RoundingMode.HALF_UP).toPlainString().replace('.', ',');
    }

    private Set<String> parseTypes(String typeFilter) {
        if (typeFilter == null || typeFilter.isBlank()) {
            return null;
        }

        String[] parts = typeFilter.split(",");
        Set<String> permitidos = Set.of("COMPRA", "VENDA");
        Set<String> set = new HashSet<>();

        for (String p : parts) {
            String trimmed = p.trim();
            if (!permitidos.contains(trimmed)) {
                throw new BadRequestException("Tipo de transação inválido: " + trimmed);
            }
            if (set.contains(trimmed)) {
                throw new BadRequestException("Tipo de transação repetido no filtro: " + trimmed);
            }
            set.add(trimmed);
        }

        return set;
    }
}
