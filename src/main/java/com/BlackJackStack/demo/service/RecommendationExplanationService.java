package com.BlackJackStack.demo.service;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.net.http.HttpTimeoutException;
import java.time.Duration;
import java.util.List;
import java.util.Locale;
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

/**
 * Service for generating explanations for blackjack strategy recommendations.
 * It can use a hosted AI model (Groq or Gemini) and falls back to deterministic explanations when unavailable.
 */
@Service
public class RecommendationExplanationService {

    private static final Logger log = LoggerFactory.getLogger(RecommendationExplanationService.class);

    private final HttpClient httpClient;
    private final ObjectMapper objectMapper;

    @Value("${21logic.ai.enabled:false}")
    private boolean aiEnabled = false;

    @Value("${21logic.ai.provider:groq}")
    private String provider = "groq";

    @Value("${21logic.ai.api-key:}")
    private String apiKey = "";

    @Value("${21logic.ai.model:llama-3.3-70b-versatile}")
    private String model = "llama-3.3-70b-versatile";

    @Value("${21logic.ai.groq.base-url:https://api.groq.com/openai/v1}")
    private String groqBaseUrl = "https://api.groq.com/openai/v1";

    @Value("${21logic.ai.gemini.base-url:https://generativelanguage.googleapis.com/v1beta}")
    private String geminiBaseUrl = "https://generativelanguage.googleapis.com/v1beta";

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
       String prompt = buildPrompt(move, playerHand, dealerCard, response);
       return generateAiOrFallback(prompt, fallback);
    }

    public String generateStrategyBoardExplanation(
           String decision,
           String hand,
           String dealer,
           String strategyType
    ) {
       String fallback = fallbackStrategyBoardExplanation(decision, hand, dealer, strategyType);
       String prompt = buildStrategyBoardPrompt(decision, hand, dealer, strategyType);
       return generateAiOrFallback(prompt, fallback);
    }

    private String generateAiOrFallback(String prompt, String fallback) {
       if (!aiEnabled || !isAiConfigured()) {
           return fallback;
       }

       try {
           String aiText = requestAiText(prompt);
           if (aiText == null || aiText.isBlank()) {
               return fallback;
           }
           return aiText.replaceAll("\\s+", " ").trim();
       } catch (HttpTimeoutException ex) {
           log.warn("Hosted AI provider timed out after {} seconds. Using fallback explanation.", timeoutSeconds);
           return fallback;
       } catch (IOException ex) {
           log.warn("AI explanation unavailable, using fallback.", ex);
           return fallback;
       } catch (InterruptedException ex) {
           Thread.currentThread().interrupt();
           log.warn("AI explanation interrupted, using fallback.", ex);
           return fallback;
       } catch (IllegalArgumentException ex) {
           log.warn("Invalid AI configuration, using fallback.", ex);
           return fallback;
       }
    }

    private boolean isAiConfigured() {
       if (apiKey == null || apiKey.isBlank()) {
           log.warn("AI provider is enabled but 21logic.ai.api-key is missing. Falling back to deterministic explanations.");
           return false;
       }

       String normalizedProvider = normalizeProvider();
       if (!"groq".equals(normalizedProvider) && !"gemini".equals(normalizedProvider)) {
           log.warn("Unsupported AI provider '{}'. Supported providers are groq and gemini; using deterministic explanations.", provider);
           return false;
       }

       return true;
    }

    private String requestAiText(String prompt) throws IOException, InterruptedException {
       HttpRequest request = buildRequest(prompt);
       HttpResponse<String> httpResponse = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
       int statusCode = httpResponse.statusCode();

       if (statusCode < 200 || statusCode >= 300) {
           if (statusCode == 429) {
               log.warn("Hosted AI provider rate limit reached. Using fallback explanation.");
           } else if (statusCode == 408 || statusCode >= 500) {
               log.warn("Hosted AI provider is unavailable (HTTP {}). Using fallback explanation.", statusCode);
           } else {
               log.warn("Hosted AI provider rejected the request (HTTP {}). Using fallback explanation.", statusCode);
           }
           return null;
       }

       String body = httpResponse.body();
       if (body == null || body.isBlank()) {
           return null;
       }

       String aiText = parseProviderResponse(body);
       return (aiText == null || aiText.isBlank()) ? null : aiText;
    }

    private HttpRequest buildRequest(String prompt) throws IOException {
       String normalizedProvider = normalizeProvider();
       if ("gemini".equals(normalizedProvider)) {
           String uri = geminiBaseUrl.replaceAll("/+$", "") + "/models/" + model + ":generateContent";
           Map<String, Object> requestBody = Map.of(
               "contents", List.of(Map.of("parts", List.of(Map.of("text", prompt))))
           );
           return HttpRequest.newBuilder()
               .uri(URI.create(uri))
               .timeout(Duration.ofSeconds(Math.max(timeoutSeconds, 1)))
               .header("Content-Type", "application/json")
               .header("x-goog-api-key", apiKey)
               .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(requestBody)))
               .build();
       }

       String uri = groqBaseUrl.replaceAll("/+$", "") + "/chat/completions";
       Map<String, Object> requestBody = Map.of(
           "model", model,
           "messages", List.of(Map.of("role", "user", "content", prompt)),
           "temperature", 0.3,
           "max_tokens", 250
       );

       return HttpRequest.newBuilder()
           .uri(URI.create(uri))
           .timeout(Duration.ofSeconds(Math.max(timeoutSeconds, 1)))
           .header("Content-Type", "application/json")
           .header("Authorization", "Bearer " + apiKey)
           .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(requestBody)))
           .build();
    }

    private String parseProviderResponse(String body) throws IOException {
       JsonNode json = objectMapper.readTree(body);
       String normalizedProvider = normalizeProvider();

       if ("gemini".equals(normalizedProvider)) {
           JsonNode candidates = json.path("candidates");
           if (!candidates.isArray() || candidates.isEmpty()) {
               return null;
           }

           JsonNode firstCandidate = candidates.get(0);
           JsonNode parts = firstCandidate.path("content").path("parts");
           if (parts.isArray()) {
               StringBuilder text = new StringBuilder();
               for (JsonNode part : parts) {
                   String partText = part.path("text").asText();
                   if (!partText.isBlank()) {
                       text.append(partText);
                   }
               }
               return text.toString();
           }
           return firstCandidate.path("content").path("parts").path("0").path("text").asText();
       }

       JsonNode messageContent = json.path("choices").path(0).path("message").path("content");
       if (messageContent.isArray()) {
           StringBuilder combined = new StringBuilder();
           for (JsonNode block : messageContent) {
               combined.append(block.path("text").asText());
           }
           return combined.toString();
       }

       return messageContent.asText();
    }

    private String normalizeProvider() {
       if (provider == null || provider.isBlank()) {
           return "groq";
       }
       return provider.trim().toLowerCase(Locale.ROOT);
    }

    private String buildStrategyBoardPrompt(
           String decision,
           String hand,
           String dealer,
           String strategyType
    ) {
       StringBuilder prompt = new StringBuilder();

       prompt.append("You are a blackjack strategy coach. ");
       prompt.append("Explain why the basic strategy chart recommends this decision. ");
       prompt.append("Keep the explanation short, clear, and educational. ");
       prompt.append("Do not mention that you are an AI. ");
       prompt.append("Do not promise that the player will win. ");
       prompt.append("Use blackjack probability and strategy reasoning. ");
       prompt.append("Explain the dealer's weakness or strength when relevant. ");
       prompt.append("Keep it to 2 sentences maximum.\n\n");

       prompt.append("Strategy type: ").append(strategyType).append("\n");
       prompt.append("Player hand/total: ").append(hand).append("\n");
       prompt.append("Dealer up card: ").append(dealer).append("\n");
       prompt.append("Recommended decision: ").append(decision).append("\n");

       return prompt.toString();
    }

    private String buildPrompt(String move, Hand playerHand, Card dealerCard, StrategyResponse response) {
       StringBuilder prompt = new StringBuilder();
       prompt.append("You are a blackjack coach. ");
       prompt.append("Write one short, friendly explanation for this recommendation. ");
       prompt.append("Do not mention that you are an AI. Do not promise wins. ");
       prompt.append("If you have Blackjack, you obviously just Stand and win 3:2 unless dealer might have Blackjack as well.");
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

    private String fallbackStrategyBoardExplanation(
           String decision,
           String hand,
           String dealer,
           String strategyType
    ) {
       if ("H".equals(decision)) {
           return "Hitting gives you another chance to improve your hand because standing here is unlikely to be strong enough against the dealer.";
       }

       if ("S".equals(decision)) {
           return "Standing is preferred because your current hand is strong enough, while another card creates unnecessary bust risk.";
       }

       if ("D".equals(decision)) {
           return "Doubling is preferred because this is a favorable situation to take exactly one more card while increasing your wager.";
       }

       if ("Ds".equals(decision)) {
           return "Doubling is preferred when allowed because you have a good opportunity to improve with one card; otherwise, standing is safer.";
       }

       if ("Y".equals(decision)) {
           return "Splitting is recommended because playing the two cards as separate hands gives you a better expected result than keeping the pair together.";
       }

       if ("Y/N".equals(decision)) {
           return "Splitting can be profitable when Double After Split is available, but without that option, keeping the pair together is generally better.";
       }

       if ("N".equals(decision)) {
           return "Keeping the pair together is preferred because splitting these cards does not produce a better expected result against this dealer up card.";
       }

       if ("SUR".equals(decision)) {
           return "Surrender is recommended because the situation is unfavorable enough that giving up half the wager has a better expected outcome than playing the hand.";
       }

       return "This decision is based on the expected value of each available action against the dealer's up card.";
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
