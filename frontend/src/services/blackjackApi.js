/**
 * This file contains functions for interacting with the backend API for a blackjack game, including getting recommendations and drawing cards.
 */

/* Define the API URLs based on the environment (development or production) */
const API_URL = import.meta.env.DEV
    ? '/api/recommend'
    : 'http://localhost:8080/api/recommend'

const DRAW_API_URL = import.meta.env.DEV
    ? '/api/draw'
    : 'http://localhost:8080/api/draw'

const EXPLANATION_API_URL = import.meta.env.DEV
    ? '/api/strategy-explanation'
    : 'http://localhost:8080/api/strategy-explanation'

/**
 * Function to get a recommendation from the backend API based on the provided form data.
 * @param formData
 * @returns {Promise<any>}
 */
export async function getRecommendation(formData) {
    const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            card1: formData.card1,
            card2: formData.card2,
            dealer: formData.dealer,
        }),
    })

    if (!response.ok) {
        throw new Error('Recommendation request failed')
    }

    return response.json()
}

/**
 * Function to draw a card from the backend API.
 * @returns {Promise<any>}
 */
export async function drawCard() {
    const response = await fetch(DRAW_API_URL, {
        method: 'POST',
    })

    if (!response.ok) {
        throw new Error('Card draw request failed')
    }

    const payload = await response.json()

    return payload
}

/**
 * Function to get an AI explanation for a basic strategy decision.
 * @param strategyData
 * @returns {Promise<any>}
 */
export async function getStrategyExplanation(strategyData) {
    const response = await fetch(EXPLANATION_API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            hand: strategyData.hand,
            dealer: strategyData.dealer,
            decision: strategyData.decision,
            strategyType: strategyData.strategyType,
        }),
    })

    if (!response.ok) {
        throw new Error('Strategy explanation request failed')
    }

    return response.json()
}