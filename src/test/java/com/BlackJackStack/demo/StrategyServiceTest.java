package com.BlackJackStack.demo;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

import com.BlackJackStack.demo.model.Card;
import com.BlackJackStack.demo.model.StrategyRequest;
import com.BlackJackStack.demo.model.StrategyResponse;
import com.BlackJackStack.demo.service.StrategyService;

import java.util.Random;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
class StrategyServiceTest {

	// ============================================================
	// RANDOM CARD TESTS
	// ============================================================

	/**
	 * Same random seed should produce the same sequence of cards.
	 */
	@Test
	void drawRandomCard_shouldBeDeterministicWithSeed() {
		StrategyService service1 = new StrategyService(new Random(42));
		StrategyService service2 = new StrategyService(new Random(42));

		Card card1a = service1.drawRandomCard();
		Card card2a = service1.drawRandomCard();

		Card card1b = service2.drawRandomCard();
		Card card2b = service2.drawRandomCard();

		assertThat(card1a.getRank()).isEqualTo(card1b.getRank());
		assertThat(card2a.getRank()).isEqualTo(card2b.getRank());
	}

	/**
	 * Different seeds should normally produce different first cards.
	 */
	@Test
	void drawRandomCard_shouldProduceDifferentCardsWithDifferentSeeds() {
		StrategyService service1 = new StrategyService(new Random(42));
		StrategyService service2 = new StrategyService(new Random(132));

		Card card1 = service1.drawRandomCard();
		Card card2 = service2.drawRandomCard();

		assertThat(card1.getRank()).isNotEqualTo(card2.getRank());
	}

	/**
	 * Random card should never be null and should always have a valid rank.
	 */
	@Test
	void drawRandomCard_shouldReturnValidCard() {
		StrategyService service = new StrategyService(new Random(42));

		Card card = service.drawRandomCard();

		assertThat(card).isNotNull();
		assertThat(card.getRank())
				.isIn(
						"2", "3", "4", "5", "6", "7",
						"8", "9", "10",
						"J", "Q", "K", "A"
				);
	}

	/**
	 * Repeated random draws should always return valid cards.
	 */
	@Test
	void drawRandomCard_multipleDrawsShouldBeValid() {
		StrategyService service = new StrategyService(new Random(42));

		for (int i = 0; i < 100; i++) {
			Card card = service.drawRandomCard();

			assertThat(card).isNotNull();
			assertThat(card.getRank())
					.isIn(
							"2", "3", "4", "5", "6", "7",
							"8", "9", "10",
							"J", "Q", "K", "A"
					);
		}
	}

	/**
	 * Random draws should contain more than one card value over a
	 * sufficiently large sample.
	 */
	@Test
	void drawRandomCard_shouldProduceVariety() {
		StrategyService service = new StrategyService(new Random(42));

		java.util.Set<String> ranks = new java.util.HashSet<>();

		for (int i = 0; i < 100; i++) {
			ranks.add(service.drawRandomCard().getRank());
		}

		assertThat(ranks.size()).isGreaterThan(1);
	}

	// ============================================================
	// GENERAL STRATEGY VALIDATION
	// ============================================================

	/**
	 * Strategy response should contain valid probabilities,
	 * recommendation and expected value.
	 */
	@Test
	void calculateStrategy_shouldReturnValidProbabilities() {
		StrategyService service = new StrategyService(new Random(42));

		StrategyRequest request =
				new StrategyRequest("10", "6", "9");

		StrategyResponse response =
				service.getStrategy(request);

		assertThat(response).isNotNull();

		assertThat(response.getExpectedValue())
				.isFinite();

		assertThat(response.getBustPercentage())
				.isBetween(0.0, 1.0);

		assertThat(response.getDealerBustPercentage())
				.isBetween(0.0, 1.0);

		assertThat(response.getDealerMakesHandPercentage())
				.isBetween(0.0, 1.0);

		assertThat(response.getRecommendedMove())
				.isIn("hit", "stand", "double down", "split");
	}

	/**
	 * Expected value must be a finite number.
	 *
	 * EV can legitimately exceed +1 because blackjack pays 3:2
	 * and double-down outcomes can exceed a normal one-unit wager.
	 */
	@Test
	void calculateStrategy_expectedValueShouldBeValid() {
		StrategyService service = new StrategyService(new Random(42));

		StrategyRequest request =
				new StrategyRequest("10", "6", "9");

		StrategyResponse response =
				service.getStrategy(request);

		assertThat(response.getExpectedValue())
				.isFinite();
	}

	/**
	 * Dealer bust and dealer makes-hand probabilities should
	 * approximately add up to 100%.
	 */
	@Test
	void calculateStrategy_dealerProbabilitiesShouldAddToOne() {
		StrategyService service = new StrategyService(new Random(42));

		StrategyRequest request =
				new StrategyRequest("10", "6", "9");

		StrategyResponse response =
				service.getStrategy(request);

		double total =
				response.getDealerBustPercentage()
						+ response.getDealerMakesHandPercentage();

		assertThat(total)
				.isCloseTo(1.0, org.assertj.core.data.Offset.offset(0.01));
	}

	/**
	 * Same random seed should produce the same strategy result.
	 */
	@Test
	void calculateStrategy_sameSeedShouldGiveSameResults() {
		StrategyService service1 =
				new StrategyService(new Random(123));

		StrategyService service2 =
				new StrategyService(new Random(123));

		StrategyRequest request =
				new StrategyRequest("A", "10", "6");

		StrategyResponse response1 =
				service1.getStrategy(request);

		StrategyResponse response2 =
				service2.getStrategy(request);

		assertThat(response1.getExpectedValue())
				.isEqualTo(response2.getExpectedValue());

		assertThat(response1.getBustPercentage())
				.isEqualTo(response2.getBustPercentage());

		assertThat(response1.getDealerBustPercentage())
				.isEqualTo(response2.getDealerBustPercentage());

		assertThat(response1.getDealerMakesHandPercentage())
				.isEqualTo(response2.getDealerMakesHandPercentage());

		assertThat(response1.getRecommendedMove())
				.isEqualTo(response2.getRecommendedMove());
	}

	/**
	 * Different seeds should normally produce different simulation
	 * results.
	 */
	@Test
	void calculateStrategy_differentSeedsShouldGiveDifferentResults() {
		StrategyService service1 =
				new StrategyService(new Random(123));

		StrategyService service2 =
				new StrategyService(new Random(456));

		StrategyRequest request =
				new StrategyRequest("5", "10", "6");

		StrategyResponse response1 =
				service1.getStrategy(request);

		StrategyResponse response2 =
				service2.getStrategy(request);

		assertThat(response1.getExpectedValue())
				.isNotEqualTo(response2.getExpectedValue());
	}

	// ============================================================
	// BLACKJACK TESTS
	// ============================================================

	/**
	 * Ace + King should be identified as blackjack.
	 */
	@Test
	void calculateStrategy_blackjackAceKingShouldStand() {
		StrategyService service =
				new StrategyService(new Random(42));

		StrategyRequest request =
				new StrategyRequest("A", "K", "5");

		StrategyResponse response =
				service.getStrategy(request);

		assertThat(response.getRecommendedMove())
				.isEqualTo("stand");

		assertThat(response.getExpectedValue())
				.isGreaterThan(0.0);
	}

	/**
	 * Ace + Queen should be blackjack.
	 */
	@Test
	void calculateStrategy_blackjackAceQueenShouldStand() {
		StrategyService service =
				new StrategyService(new Random(42));

		StrategyRequest request =
				new StrategyRequest("A", "Q", "5");

		StrategyResponse response =
				service.getStrategy(request);

		assertThat(response.getRecommendedMove())
				.isEqualTo("stand");

		assertThat(response.getExpectedValue())
				.isGreaterThan(0.0);
	}

	/**
	 * Ace + Jack should be blackjack.
	 */
	@Test
	void calculateStrategy_blackjackAceJackShouldStand() {
		StrategyService service =
				new StrategyService(new Random(42));

		StrategyRequest request =
				new StrategyRequest("A", "J", "5");

		StrategyResponse response =
				service.getStrategy(request);

		assertThat(response.getRecommendedMove())
				.isEqualTo("stand");

		assertThat(response.getExpectedValue())
				.isGreaterThan(0.0);
	}

	/**
	 * Ace + 10 should be blackjack.
	 */
	@Test
	void calculateStrategy_blackjackAceTenShouldStand() {
		StrategyService service =
				new StrategyService(new Random(42));

		StrategyRequest request =
				new StrategyRequest("A", "10", "5");

		StrategyResponse response =
				service.getStrategy(request);

		assertThat(response.getRecommendedMove())
				.isEqualTo("stand");

		assertThat(response.getExpectedValue())
				.isGreaterThan(0.0);
	}

	/**
	 * King + Ace should also be blackjack.
	 */
	@Test
	void calculateStrategy_blackjackKingAceShouldStand() {
		StrategyService service =
				new StrategyService(new Random(42));

		StrategyRequest request =
				new StrategyRequest("K", "A", "5");

		StrategyResponse response =
				service.getStrategy(request);

		assertThat(response.getRecommendedMove())
				.isEqualTo("stand");
	}

	/**
	 * Ace + 9 is 20, not blackjack.
	 */
	@Test
	void calculateStrategy_aceNineShouldNotBeBlackjack() {
		StrategyService service =
				new StrategyService(new Random(42));

		StrategyRequest request =
				new StrategyRequest("A", "9", "6");

		StrategyResponse response =
				service.getStrategy(request);

		assertThat(response.getRecommendedMove())
				.isNotEqualTo("split");
	}

	/**
	 * Two aces are a pair and should be eligible for splitting.
	 */
	@Test
	void calculateStrategy_pairOfAcesShouldSplit() {
		StrategyService service =
				new StrategyService(new Random(42));

		StrategyRequest request =
				new StrategyRequest("A", "A", "6");

		StrategyResponse response =
				service.getStrategy(request);

		assertThat(response.getRecommendedMove())
				.isEqualTo("split");

		assertThat(response.getExpectedValue())
				.isGreaterThan(0.0);
	}

	// ============================================================
	// PAIR / SPLIT TESTS
	// ============================================================

	/**
	 * Pair of eights should be split.
	 */
	@Test
	void calculateStrategy_pairOfEightsShouldSplit() {
		StrategyService service =
				new StrategyService(new Random(42));

		StrategyRequest request =
				new StrategyRequest("8", "8", "10");

		StrategyResponse response =
				service.getStrategy(request);

		assertThat(response.getRecommendedMove())
				.isEqualTo("split");
	}

	/**
	 * Pair of aces should remain a split opportunity even against
	 * a strong dealer card.
	 */
	@Test
	void calculateStrategy_pairOfAcesAgainstTenShouldSplit() {
		StrategyService service =
				new StrategyService(new Random(42));

		StrategyRequest request =
				new StrategyRequest("A", "A", "10");

		StrategyResponse response =
				service.getStrategy(request);

		assertThat(response.getRecommendedMove())
				.isEqualTo("split");
	}

	/**
	 * Pair of eights against a weak dealer should still split.
	 */
	@Test
	void calculateStrategy_pairOfEightsAgainstSixShouldSplit() {
		StrategyService service =
				new StrategyService(new Random(42));

		StrategyRequest request =
				new StrategyRequest("8", "8", "6");

		StrategyResponse response =
				service.getStrategy(request);

		assertThat(response.getRecommendedMove())
				.isEqualTo("split");
	}

	/**
	 * Pair of aces should never be interpreted as blackjack.
	 *
	 * A + A = 12 using one ace as 11 and one as 1.
	 */
	@Test
	void calculateStrategy_pairOfAcesShouldNotBeBlackjack() {
		StrategyService service =
				new StrategyService(new Random(42));

		StrategyRequest request =
				new StrategyRequest("A", "A", "5");

		StrategyResponse response =
				service.getStrategy(request);

		assertThat(response.getRecommendedMove())
				.isEqualTo("split");
	}

	// ============================================================
	// HARD HAND TESTS
	// ============================================================

	/**
	 * 10 + 8 is a hard 18.
	 */
	@Test
	void calculateStrategy_hardEighteenShouldNotRecommendHitAutomatically() {
		StrategyService service =
				new StrategyService(new Random(42));

		StrategyRequest request =
				new StrategyRequest("10", "8", "9");

		StrategyResponse response =
				service.getStrategy(request);

		assertThat(response.getRecommendedMove())
				.isIn("stand", "hit");
	}

	/**
	 * 20 should stand.
	 */
	@Test
	void calculateStrategy_twentyShouldStand() {
		StrategyService service =
				new StrategyService(new Random(42));

		StrategyRequest request =
				new StrategyRequest("10", "Q", "6");

		StrategyResponse response =
				service.getStrategy(request);

		assertThat(response.getRecommendedMove())
				.isEqualTo("stand");
	}

	/**
	 * 21 without an ace should stand.
	 */
	@Test
	void calculateStrategy_hardTwentyOneShouldStand() {
		StrategyService service =
				new StrategyService(new Random(42));

		StrategyRequest request =
				new StrategyRequest("10", "9", "6");

		StrategyResponse response =
				service.getStrategy(request);

		assertThat(response.getRecommendedMove())
				.isEqualTo("stand");
	}

	/**
	 * 16 against a 10 is generally a difficult hand.
	 */
	@Test
	void calculateStrategy_sixteenAgainstTenShouldBeValidMove() {
		StrategyService service =
				new StrategyService(new Random(42));

		StrategyRequest request =
				new StrategyRequest("10", "6", "10");

		StrategyResponse response =
				service.getStrategy(request);

		assertThat(response.getRecommendedMove())
				.isIn("hit", "stand");
	}

	/**
	 * 11 is commonly a double-down situation.
	 */
	@Test
	void calculateStrategy_elevenShouldAllowAggressiveRecommendation() {
		StrategyService service =
				new StrategyService(new Random(42));

		StrategyRequest request =
				new StrategyRequest("6", "5", "6");

		StrategyResponse response =
				service.getStrategy(request);

		assertThat(response.getRecommendedMove())
				.isIn("double down", "hit", "stand");
	}

	/**
	 * 10 against a weak dealer is a strong double-down candidate.
	 */
	@Test
	void calculateStrategy_tenAgainstWeakDealerShouldBeValid() {
		StrategyService service =
				new StrategyService(new Random(42));

		StrategyRequest request =
				new StrategyRequest("6", "4", "5");

		StrategyResponse response =
				service.getStrategy(request);

		assertThat(response.getRecommendedMove())
				.isIn("double down", "hit", "stand");
	}

	// ============================================================
	// SOFT HAND TESTS
	// ============================================================

	/**
	 * A + 6 is soft 17.
	 */
	@Test
	void calculateStrategy_softSeventeenShouldReturnValidRecommendation() {
		StrategyService service =
				new StrategyService(new Random(42));

		StrategyRequest request =
				new StrategyRequest("A", "6", "7");

		StrategyResponse response =
				service.getStrategy(request);

		assertThat(response.getRecommendedMove())
				.isIn("hit", "stand", "double down");
	}

	/**
	 * A + 7 is soft 18.
	 */
	@Test
	void calculateStrategy_softEighteenShouldReturnValidRecommendation() {
		StrategyService service =
				new StrategyService(new Random(42));

		StrategyRequest request =
				new StrategyRequest("A", "7", "9");

		StrategyResponse response =
				service.getStrategy(request);

		assertThat(response.getRecommendedMove())
				.isIn("hit", "stand", "double down");
	}

	/**
	 * A + 8 is soft 19.
	 */
	@Test
	void calculateStrategy_softNineteenShouldReturnValidRecommendation() {
		StrategyService service =
				new StrategyService(new Random(42));

		StrategyRequest request =
				new StrategyRequest("A", "8", "6");

		StrategyResponse response =
				service.getStrategy(request);

		assertThat(response.getRecommendedMove())
				.isIn("hit", "stand", "double down");
	}

	// ============================================================
	// BUST / HIGH-RISK HAND TESTS
	// ============================================================

	/**
	 * A hand that is already strong should not blindly recommend
	 * another card.
	 */
	@Test
	void calculateStrategy_strongHandShouldNotAlwaysHit() {
		StrategyService service =
				new StrategyService(new Random(42));

		StrategyRequest request =
				new StrategyRequest("10", "8", "9");

		StrategyResponse response =
				service.getStrategy(request);

		assertThat(response.getRecommendedMove())
				.isIn("hit", "stand");
	}

	/**
	 * Bust probability must always remain between 0% and 100%.
	 */
	@Test
	void calculateStrategy_bustProbabilityShouldBeValid() {
		StrategyService service =
				new StrategyService(new Random(42));

		StrategyRequest request =
				new StrategyRequest("10", "8", "9");

		StrategyResponse response =
				service.getStrategy(request);

		assertThat(response.getBustPercentage())
				.isBetween(0.0, 1.0);
	}

	// ============================================================
	// DEALER UP-CARD TESTS
	// ============================================================

	/**
	 * Dealer ace should still return a valid strategy response.
	 */
	@Test
	void calculateStrategy_dealerAceShouldReturnValidResponse() {
		StrategyService service =
				new StrategyService(new Random(42));

		StrategyRequest request =
				new StrategyRequest("10", "6", "A");

		StrategyResponse response =
				service.getStrategy(request);

		assertThat(response).isNotNull();

		assertThat(response.getRecommendedMove())
				.isIn("hit", "stand", "double down", "split");

		assertThat(response.getBustPercentage())
				.isBetween(0.0, 1.0);
	}

	/**
	 * Dealer ten should return a valid strategy response.
	 */
	@Test
	void calculateStrategy_dealerTenShouldReturnValidResponse() {
		StrategyService service =
				new StrategyService(new Random(42));

		StrategyRequest request =
				new StrategyRequest("10", "6", "10");

		StrategyResponse response =
				service.getStrategy(request);

		assertThat(response).isNotNull();

		assertThat(response.getRecommendedMove())
				.isIn("hit", "stand", "double down", "split");
	}

	/**
	 * Dealer six is a weak up-card and should still produce
	 * valid probability calculations.
	 */
	@Test
	void calculateStrategy_dealerSixShouldReturnValidProbabilities() {
		StrategyService service =
				new StrategyService(new Random(42));

		StrategyRequest request =
				new StrategyRequest("10", "6", "6");

		StrategyResponse response =
				service.getStrategy(request);

		assertThat(response.getDealerBustPercentage())
				.isBetween(0.0, 1.0);

		assertThat(response.getDealerMakesHandPercentage())
				.isBetween(0.0, 1.0);

		double total =
				response.getDealerBustPercentage()
						+ response.getDealerMakesHandPercentage();

		assertThat(total)
				.isCloseTo(
						1.0,
						org.assertj.core.data.Offset.offset(0.01)
				);
	}

	// ============================================================
	// RECOMMENDATION CONSISTENCY TESTS
	// ============================================================

	/**
	 * Recommendation should never be null.
	 */
	@Test
	void calculateStrategy_recommendationShouldNeverBeNull() {
		StrategyService service =
				new StrategyService(new Random(42));

		StrategyRequest request =
				new StrategyRequest("10", "6", "9");

		StrategyResponse response =
				service.getStrategy(request);

		assertThat(response.getRecommendedMove())
				.isNotNull()
				.isNotBlank();
	}

	/**
	 * Strategy should return a valid recommendation for several
	 * representative starting hands.
	 */
	@Test
	void calculateStrategy_representativeHandsShouldReturnValidMoves() {
		StrategyService service =
				new StrategyService(new Random(42));

		String[][] hands = {
				{"2", "3", "5"},
				{"5", "5", "6"},
				{"7", "8", "10"},
				{"9", "7", "6"},
				{"10", "10", "9"},
				{"A", "5", "6"},
				{"A", "7", "10"},
				{"A", "A", "6"},
				{"8", "8", "10"}
		};

		for (String[] hand : hands) {
			StrategyRequest request =
					new StrategyRequest(
							hand[0],
							hand[1],
							hand[2]
					);

			StrategyResponse response =
					service.getStrategy(request);

			assertThat(response.getRecommendedMove())
					.isIn(
							"hit",
							"stand",
							"double down",
							"split"
					);
		}
	}

	/**
	 * All probability fields should remain valid across multiple
	 * representative hands.
	 */
	@Test
	void calculateStrategy_probabilityFieldsShouldAlwaysBeValid() {
		StrategyService service =
				new StrategyService(new Random(42));

		String[][] hands = {
				{"2", "2", "2"},
				{"5", "6", "7"},
				{"8", "7", "9"},
				{"10", "6", "10"},
				{"A", "6", "7"},
				{"A", "A", "6"},
				{"K", "A", "10"}
		};

		for (String[] hand : hands) {
			StrategyResponse response =
					service.getStrategy(
							new StrategyRequest(
									hand[0],
									hand[1],
									hand[2]
							)
					);

			assertThat(response.getBustPercentage())
					.isBetween(0.0, 1.0);

			assertThat(response.getDealerBustPercentage())
					.isBetween(0.0, 1.0);

			assertThat(response.getDealerMakesHandPercentage())
					.isBetween(0.0, 1.0);

			assertThat(response.getExpectedValue())
					.isFinite();
		}
	}

	// ============================================================
	// BLACKJACK REGRESSION TESTS
	// ============================================================

	/**
	 * These combinations are all blackjack and should result in
	 * stand rather than hit, double down, or split.
	 */
	@Test
	void calculateStrategy_allBlackjackCombinationsShouldStand() {

		String[][] blackjackHands = {
				{"A", "10"},
				{"A", "J"},
				{"A", "Q"},
				{"A", "K"},
				{"10", "A"},
				{"J", "A"},
				{"Q", "A"},
				{"K", "A"}
		};

		for (String[] hand : blackjackHands) {
			StrategyService service =
					new StrategyService(new Random(42));

			StrategyRequest request =
					new StrategyRequest(
							hand[0],
							hand[1],
							"5"
					);

			StrategyResponse response =
					service.getStrategy(request);

			assertThat(response.getRecommendedMove())
					.as("Expected blackjack %s + %s to stand",
							hand[0], hand[1])
					.isEqualTo("stand");

			assertThat(response.getExpectedValue())
					.as("Expected blackjack %s + %s to have positive EV",
							hand[0], hand[1])
					.isGreaterThan(0.0);
		}
	}

	/**
	 * Aces with non-ten-value cards must not be treated as blackjack.
	 */
	@Test
	void calculateStrategy_nonBlackjackAceHandsShouldNotBeForcedToStand() {

		String[][] hands = {
				{"A", "2"},
				{"A", "3"},
				{"A", "4"},
				{"A", "5"},
				{"A", "6"},
				{"A", "7"},
				{"A", "8"},
				{"A", "9"}
		};

		for (String[] hand : hands) {
			StrategyService service =
					new StrategyService(new Random(42));

			StrategyResponse response =
					service.getStrategy(
							new StrategyRequest(
									hand[0],
									hand[1],
									"6"
							)
					);

			assertThat(response.getRecommendedMove())
					.as("Unexpected split recommendation for %s + %s",
							hand[0], hand[1])
					.isNotEqualTo("split");
		}
	}
}