package com.BlackJackStack.demo.model;

import java.util.List;
import java.util.ArrayList;

/**
 * Class that represents a hand of cards in a Blackjack game.
 */
public class Hand {
    private List<Card> cards;
    private boolean isBlackjack;

    /**
     * Constructs an empty Hand object.
     */
    public Hand() {
        this.cards = new ArrayList<>();
        this.isBlackjack = false;
    }
    
    /**
     * Copy constructor to create a new Hand object as a copy of another Hand.
     * @param other the Hand object to copy
     */
    public Hand(Hand other) {
        this.cards = new ArrayList<>();
        for (Card card : other.cards) {
            this.cards.add(new Card(card.getRank()));
        }
    }

    /**
     * Adds a card to the hand and checks for blackjack.
     * @param card the Card object to add to the hand
     */
    public void addCard(Card card) {
        cards.add(card);
        if (cards.size() == 2 && getValue() == 21) {
            isBlackjack = true;
        }
    }

    /**
     * Calculates the total value of the hand, accounting for Aces as 1 or 11.
     * @return the total value of the hand as an integer
     */
    public int getValue() {
        int value = 0;
        int acesCount = 0;

        for (Card card : cards) {
            value += card.getValue();
            if (card.isAce()) {
                acesCount++;
            }
        }

        while (value > 21 && acesCount > 0) {
            value -= 10; // Convert an Ace from 11 to 1
            acesCount--;
        }

        return value;
    }

    /**
     * Checks if the hand is a blackjack (exactly two cards totaling 21).
     * @return true if the hand is a blackjack, false otherwise
     */
    public boolean isBlackjack() {
        return cards.size() == 2 && getValue() == 21;
    }
    
    /**
     * Gets the list of cards in the hand.
     * @return the list of Card objects in the hand
     */
    public List<Card> getCards() {
        return cards;
    }
    
    /**
     * Checks if the hand is busted (value exceeds 21).
     * @return true if the hand is busted, false otherwise
     */
    public boolean isBusted() {
        return getValue() > 21;
    }
    
    /**
     * Checks if the hand is a soft hand (contains an Ace counted as 11).
     * @return true if the hand is soft, false otherwise
     */
    public boolean isSoft() {
        int total = 0;
        boolean hasAce = false;
        for (Card card : cards) {
            total += card.getValue();
            if (card.isAce()) {
                hasAce = true;
            }
        }
        return hasAce && total <= 21 && total >= 12;
    }
    
    /**
     * Checks if the hand can be split (exactly two cards of the same rank).
     * @return true if the hand can be split, false otherwise
     */
    public boolean canSplit() {
        return cards.size() == 2 && cards.get(0).getRank().equals(cards.get(1).getRank());
    }

    /**
     * Provides a string representation of the hand, including cards, total value, and blackjack status.
     * @return a string representation of the hand
     */
    @Override
    public String toString() {
        return cards.toString() + " (Value: " + getValue() + ", Blackjack: " + isBlackjack + ")";
    }

}
