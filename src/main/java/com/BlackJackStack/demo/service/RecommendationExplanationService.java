package com.BlackJackStack.demo.service;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.BlackJackStack.demo.model.Card;
import com.BlackJackStack.demo.model.Hand;
import com.BlackJackStack.demo.model.StrategyResponse;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

@Service
public class RecommendationExplanationService {

    private static final Logger log = LoggerFactory.getLogger(RecommendationExplanationService.class);

    private final HttpClient httpClient;
    private final ObjectMapper objectMapper;

    @Value("${21logic.ai.enabled:false}")
    private boolean aiEnabled = false;

    @Value("${21logic.ai.ollama.base-url:http://localhost:11434}")
    private String ollamaBaseUrl = "http://localhost:11434";

    @Value("${21logic.ai.ollama.model:llama3.1:latest}")
    private String ollamaModel = "llama3.1:latest";

    @Value("${21logic.ai.timeout-seconds:20}")
    private int timeoutSeconds = 20;

    public RecommendationExplanationService() {
        this.httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(2))
            .build();
        this.objectMapper = new ObjectMapper();
    }

    public String generateExplanation(String move, Hand playerHand, Card dealerCard, StrategyResponse response) {
        String fallback = fallbackExplanation(move, playerHand, playerHand.getValue(), playerHand.isSoft());
        if (!aiEnabled) {
            return fallback;
        }

        String prompt = buildPrompt(move, playerHand, dealerCard, response);
        try {
            Map<String, Object> requestBody = Map.of(
                "model", ollamaModel,
                "prompt", prompt,
                "stream", Boolean.FALSE
            );

            HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(ollamaBaseUrl + "/api/generate"))
                .timeout(Duration.ofSeconds(Math.max(timeoutSeconds, 1)))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(requestBody)))
                .build();

            HttpResponse<String> httpResponse = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (httpResponse.statusCode() < 200 || httpResponse.statusCode() >= 300) {
                log.warn("Ollama returned HTTP {}. Falling back to deterministic explanation.", httpResponse.statusCode());
                return fallback;
            }

            JsonNode json = objectMapper.readTree(httpResponse.body());
            String aiText = json.path("response").asText("").trim();
            if (aiText.isEmpty()) {
                return fallback;
            }

            return aiText.replaceAll("\\s+", " ").trim();
        } catch (IOException ex) {
            log.warn("AI explanation unavailable, using fallback explanation.", ex);
            return fallback;
        } catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
            log.warn("AI explanation interrupted, using fallback explanation.", ex);
            return fallback;
        } catch (IllegalArgumentException ex) {
            log.warn("Invalid AI configuration, using fallback explanation.", ex);
            return fallback;
        }
    }

    private String buildPrompt(String move, Hand playerHand, Card dealerCard, StrategyResponse response) {
        StringBuilder prompt = new StringBuilder();
        prompt.append("You are a blackjack coach. ");
        prompt.append("Write one short, friendly explanation for this recommendation. ");
        prompt.append("Do not mention that you are an AI. Do not promise wins. ");
        prompt.append("Keep it to 2 sentences max and make it practical.\n\n");
        prompt.append("Player hand: ").append(playerHand.getCards()).append(" (total ").append(playerHand.getValue());
        prompt.append(", soft=").append(playerHand.isSoft()).append(")\n");
        prompt.append("Dealer up card: ").append(dealerCard.getRank()).append("\n");
        prompt.append("Recommended move: ").append(move).append("\n");
        prompt.append("Bust chance: ").append(formatPercent(response.getBustPercentage())).append("\n");
        prompt.append("Dealer bust chance: ").append(formatPercent(response.getDealerBustPercentage())).append("\n");
        prompt.append("Dealer makes hand chance: ").append(formatPercent(response.getDealerMakesHandPercentage())).append("\n");
        prompt.append("Expected value: ").append(String.format("%.2f", response.getExpectedValue())).append("\n");
        return prompt.toString();
    }

    private String formatPercent(double value) {
        return String.format("%.1f%%", value * 100.0);
    }

    private String fallbackExplanation(String move, Hand playerHand, int playerTotal, boolean isSoft) {
        if ("hit".equals(move) && isSoft) {
            return "You have a soft hand, so taking another card is usually the best way to improve without a big bust risk.";
        }
        if ("double down".equals(move) && playerTotal == 11) {
            return "You should double down on 11. It gives you a strong chance to make a winning hand with one card.";
    }
        if ("double down".equals(move) && playerTotal == 10) {
            return "You should double down on 10. You are in a strong spot and can often improve with one more card.";
        }
        if ("stand".equals(move) && playerTotal >= 17) {
            return "Standing makes sense here because your hand is already strong and hitting adds too much bust risk.";
        }
        if ("split".equals(move) && playerHand.canSplit()) {
            return "Splitting gives each card a chance to become a stronger hand, which is especially valuable for this pair.";
        }
        return "This recommendation balances bust risk, dealer pressure, and expected value for the current hand.";
    }
}
