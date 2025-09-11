package com.BlackJackStack.demo.model;

/**
 * Class that represents a playing card in a standard deck.
 */
public class Card {
    private String rank;

    /**
     * Constructs a Card object from a string representation.
     * Acceptable values are "2"–"10", "J", "Q", "K", "A".
     *
     * @param cardString the string representation of the card
     * @throws IllegalArgumentException if the input is invalid
     */
    public Card(String cardString) {
        if (cardString == null || cardString.trim().isEmpty()) {
            throw new IllegalArgumentException("Invalid card input: " + cardString);
        }

        cardString = cardString.trim().toUpperCase();

        // Acceptable values: "2"–"10", "J", "Q", "K", "A"
        if (cardString.equals("A") || cardString.equals("J") || cardString.equals("Q") || cardString.equals("K") || cardString.equals("10")
                || cardString.matches("[2-9]")) {
            this.rank = cardString;
        } else {
            throw new IllegalArgumentException("Invalid card rank: " + cardString);
        }
    }


    /**
     * Method to get the rank of the card.
     * @return the rank of the card as a string (e.g., "A", "K", "10", "2", etc.)
     */
    public String getRank() {
        return rank;
    }

    /**
     * Method to get the Blackjack value of the card.
     * @return the value of the card as an integer (e.g., 11 for Ace, 10 for face cards, numeric value for others)
     */
    public int getValue() {
        switch (rank) {
            case "A":
                return 11; // default to 11, adjust later in hand logic
            case "K":
            case "Q":
            case "J":
                return 10;
            default:
                try {
                    return Integer.parseInt(rank);
                } catch (NumberFormatException e) {
                    throw new IllegalArgumentException("Invalid rank: " + rank);
                }
        }
    }

    /**
     * Method to check if the card is an Ace.
     * @return true if the card is an Ace, false otherwise
     */
    public boolean isAce() {
        return "A".equals(rank);
    }

    /**
     * Method to get a string representation of the card.
     * @return the rank of the card as a string
     */
    @Override
    public String toString() {
        return rank;
    }
}

