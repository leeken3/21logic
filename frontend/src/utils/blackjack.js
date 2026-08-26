/**
 * This file contains utility functions and constants for a blackjack game, including card normalization, validation, hand scoring, and formatting.
 */

/**
 * Valid card values in a standard deck of cards
 * @type {string[]}
 */
export const validCardValues = [
    'A',
    '2',
    '3',
    '4',
    '5',
    '6',
    '7',
    '8',
    '9',
    '10',
    'J',
    'Q',
    'K',
]

/**
 * Order of suits in a standard deck of cards
 * @type {string[]}
 */
export const suitOrder = ['♣', '♦', '♥', '♠']

/**
 * Colors associated with each suit in a standard deck of cards
 * @type {{"♥": string, "♦": string, "♣": string, "♠": string}}
 */
export const suitColors = {
    '♥': '#d9305d',
    '♦': '#d9305d',
    '♣': '#111827',
    '♠': '#111827',
}

/**
 * Values of cards in a standard deck of cards
 * @type {string[]}
 */
export const deckValues = [
    'A',
    '2',
    '3',
    '4',
    '5',
    '6',
    '7',
    '8',
    '9',
    '10',
    'J',
    'Q',
    'K',
]

/**
 * Normalize a card value to a standard format (uppercase, trimmed, and '1' converted to 'A')
 * @param value
 * @returns {string}
 */
export function normalizeCard(value) {
    const cleaned = value?.toString().trim().toUpperCase()

    if (!cleaned) return ''

    if (cleaned === '1') return 'A'

    return cleaned
}

/**
 * Check if a card value is valid
 * @param value
 * @returns {boolean}
 */
export function isValidCardValue(value) {
    const normalized = normalizeCard(value)

    return validCardValues.includes(normalized)
}

/**
 * Convert a card value to a card object with value and suit
 * @param value
 * @param index
 * @returns {null|{value: string, suit: string}}
 */
export function toCardObject(value, index = 0) {
    const normalized = normalizeCard(value)

    if (!normalized) return null

    const suit =
        suitOrder[(normalized.charCodeAt(0) + index) % suitOrder.length]

    return {
        value: normalized,
        suit,
    }
}

/**
 * Generate a random card object with value and suit
 * @param index
 * @returns {{value: string, suit: string}}
 */
export function randomCard(index = 0) {
    const value =
        deckValues[Math.floor(Math.random() * deckValues.length)]

    const suit =
        suitOrder[
        (Math.floor(Math.random() * suitOrder.length) + index) %
        suitOrder.length
            ]

    return {
        value,
        suit,
    }
}

/**
 * Calculate the total value of a hand of cards in blackjack
 * @param cards
 * @returns {number}
 */
export function getHandTotal(cards) {
    let total = cards.reduce((sum, rawCard) => {
        const card =
            rawCard && typeof rawCard === 'object'
                ? rawCard
                : toCardObject(rawCard)

        if (!card) return sum

        const value = normalizeCard(card.value)

        if (value === 'A') return sum + 11

        if (['K', 'Q', 'J'].includes(value)) {
            return sum + 10
        }

        const parsed = Number(value)

        return sum + (Number.isNaN(parsed) ? 0 : parsed)
    }, 0)

    let aces = cards.filter(
        (rawCard) =>
            normalizeCard(
                rawCard && typeof rawCard === 'object'
                    ? rawCard.value
                    : rawCard,
            ) === 'A',
    ).length

    while (total > 21 && aces > 0) {
        total -= 10
        aces -= 1
    }

    return total
}

/**
 * Check if a hand of cards is a blackjack (an Ace and a 10-value card)
 * @param cards
 * @returns {boolean}
 */
export function isBlackjack(cards) {
    if (!cards || cards.length !== 2) {
        return false
    }

    const values = cards.map((card) =>
        normalizeCard(
            card && typeof card === 'object'
                ? card.value
                : card,
        ),
    )

    const hasAce = values.includes('A')

    const hasTenValue = values.some((value) =>
        ['10', 'J', 'Q', 'K'].includes(value),
    )

    return hasAce && hasTenValue
}

/**
 * Get the displayed total of a hand of cards, accounting for soft and hard totals
 * @param cards
 * @returns {string}
 */
export function getDisplayedPlayerTotal(cards) {
    const total = getHandTotal(cards)

    const aceCount = cards.filter(
        (rawCard) =>
            normalizeCard(
                rawCard && typeof rawCard === 'object'
                    ? rawCard.value
                    : rawCard,
            ) === 'A',
    ).length

    const hardTotal = cards.reduce((sum, rawCard) => {
        const value = normalizeCard(
            rawCard && typeof rawCard === 'object'
                ? rawCard.value
                : rawCard,
        )

        if (value === 'A') return sum + 1

        if (['K', 'Q', 'J'].includes(value)) {
            return sum + 10
        }

        const numericValue = Number(value)

        return sum + (Number.isNaN(numericValue) ? 0 : numericValue)
    }, 0)

    const softTotal =
        aceCount > 0
            ? hardTotal + 10
            : hardTotal

    if (total === 21 || aceCount === 0) {
        return `${total}`
    }

    return softTotal <= 21
        ? `${hardTotal} / ${softTotal}`
        : `${total}`
}

/**
 * Format a monetary amount with a dollar sign and appropriate sign for positive or negative values
 * @param amount
 * @returns {string}
 */
export function formatMoney(amount) {
    if (amount > 0) {
        return `+$${amount}`
    }

    if (amount < 0) {
        return `-$${Math.abs(amount)}`
    }

    return '$0'
}

/**
 * Score a split hand against the dealer's total and return a summary and net result
 * @param cards
 * @param dealerTotal
 * @param bet
 * @returns {{summary: string, net: number}|{summary: string, net: *}|{summary: string, net: number}|{summary: string, net: *}|{summary: string, net: number}}
 */
export function scoreSplitHand(cards, dealerTotal, bet) {
    const playerTotal = getHandTotal(cards)

    if (playerTotal > 21) {
        return {
            summary: `busts with ${playerTotal}`,
            net: -bet,
        }
    }

    if (dealerTotal > 21) {
        return {
            summary: `wins ${playerTotal} (dealer bust)`,
            net: bet,
        }
    }

    if (playerTotal > dealerTotal) {
        return {
            summary: `wins ${playerTotal} to ${dealerTotal}`,
            net: bet,
        }
    }

    if (playerTotal === dealerTotal) {
        return {
            summary: `pushes at ${playerTotal}`,
            net: 0,
        }
    }

    return {
        summary: `loses ${playerTotal} to ${dealerTotal}`,
        net: -bet,
    }
}

/**
 * Get the label for a split hand based on its index (1 for right hand, 2 for left hand)
 * @param index
 * @returns {string}
 */
export function splitHandLabel(index) {
    return index === 1 ? 'Right hand' : 'Left hand'
}

/**
 * Get the face of a card based on its value and index
 * @param value
 * @param index
 * @returns {{rank: string, suit: string|*|string, hidden: boolean}|{rank: string, suit: string, hidden: boolean}}
 */
export function getCardFace(value, index) {
    const safeValue =
        value && typeof value === 'object'
            ? value.value
            : normalizeCard(value)

    if (!safeValue || safeValue === '?') {
        return {
            rank: '?',
            suit: '',
            hidden: true,
        }
    }

    const normalized = normalizeCard(safeValue)

    const rank = normalized

    const suit =
        value && typeof value === 'object'
            ? value.suit
            : suitOrder[
            (normalized.charCodeAt(0) + index) %
            suitOrder.length
                ]

    return {
        rank,
        suit,
        hidden: false,
    }
}