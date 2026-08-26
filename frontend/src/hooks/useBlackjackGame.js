import { useRef, useState } from 'react'

import {
    getHandTotal,
    isBlackjack,
    normalizeCard,
    toCardObject,
    randomCard,
    splitHandLabel,
    scoreSplitHand,
    formatMoney,
    isValidCardValue,
} from '../utils/blackjack'

import {
    drawCard,
} from '../services/blackjackApi'

const TABLE_BET = 10

const SPLIT_RIGHT = 1
const SPLIT_LEFT = 0

export function useBlackjackGame() {
    const [playerHand, setPlayerHand] = useState([])
    const [dealerHand, setDealerHand] = useState([])

    const [dealerHidden, setDealerHidden] = useState(true)

    const [resolvedPlayerHand, setResolvedPlayerHand] = useState([])
    const [resolvedDealerHand, setResolvedDealerHand] = useState([])

    const [handComplete, setHandComplete] = useState(false)
    const [hasStarted, setHasStarted] = useState(false)

    const [handMessage, setHandMessage] = useState(
        'Ready for the next hand.',
    )

    const [bet, setBet] = useState(TABLE_BET)

    const [lastDrawnCard, setLastDrawnCard] = useState(null)

    const [playerBlackjack, setPlayerBlackjack] = useState(false)

    const [splitMode, setSplitMode] = useState(false)
    const [splitHands, setSplitHands] = useState([])
    const [activeSplitIndex, setActiveSplitIndex] = useState(null)
    const [splitAceMode, setSplitAceMode] = useState(false)
    const [selectedAction, setSelectedAction] = useState('Hit')

    const playerHandRef = useRef([])
    const dealerHandRef = useRef([])

    const hasStartedRef = useRef(false)
    const betRef = useRef(TABLE_BET)

    const splitModeRef = useRef(false)
    const splitHandsRef = useRef([])
    const activeSplitIndexRef = useRef(null)
    const splitAceModeRef = useRef(false)

    const actionLockRef = useRef(false)

    const drawPlayerCard = async (index) => {
        const payload = await drawCard()

        const value = normalizeCard(payload.rank)

        if (!isValidCardValue(value)) {
            throw new Error('Strategy engine returned an invalid card')
        }

        return toCardObject(value, index)
    }

    const syncPlayerHand = (cards) => {
        playerHandRef.current = cards
        setPlayerHand(cards)
        setResolvedPlayerHand(cards)
    }

    const syncDealerHand = (cards) => {
        dealerHandRef.current = cards
        setDealerHand(cards)
        setResolvedDealerHand(cards)
    }

    const syncSplitHands = (hands) => {
        splitHandsRef.current = hands
        setSplitHands(hands)
    }

    const setActiveSplit = (index) => {
        activeSplitIndexRef.current = index
        setActiveSplitIndex(index)
    }

    const setSplitEnabled = (enabled) => {
        splitModeRef.current = enabled
        setSplitMode(enabled)
    }

    const setSplitAceEnabled = (enabled) => {
        splitAceModeRef.current = enabled
        setSplitAceMode(enabled)
    }

    // Pause utility function to create a delay for animations and game flow.
    const pause = (duration) =>
        new Promise((resolve) => setTimeout(resolve, duration))

    // Play the dealer's hand according to standard blackjack rules: reveal the hidden card, draw until reaching at least 17, and update state accordingly.
    const playDealerHand = async (dealerCards) => {
        let nextDealerCards = [...dealerCards]
        dealerHandRef.current = nextDealerCards
        setDealerHand(nextDealerCards)
        setDealerHidden(false)
        await pause(450)

        let dealerTotal = getHandTotal(nextDealerCards)
        while (dealerTotal < 17) {
            const nextCard = randomCard(nextDealerCards.length)
            nextDealerCards = [...nextDealerCards, nextCard]
            dealerHandRef.current = nextDealerCards
            setLastDrawnCard({ side: 'dealer', key: Date.now() })
            setDealerHand(nextDealerCards)
            await pause(500)
            dealerTotal = getHandTotal(nextDealerCards)
        }

        syncDealerHand(nextDealerCards)
        return nextDealerCards
    }

    // Normal Round Resolution: Compare player and dealer hands, determine outcome, and update state accordingly.
    const resolveDealerRound = async (playerCards, dealerCards, currentBet) => {
        syncPlayerHand(playerCards)
        const nextDealerCards = await playDealerHand(dealerCards)
        const dealerTotal = getHandTotal(nextDealerCards)
        const playerTotal = getHandTotal(playerCards)
        const playerHasBlackjack = isBlackjack(playerCards)
        const dealerHasBlackjack = isBlackjack(nextDealerCards)

        let outcome = ''

        if (playerHasBlackjack && dealerHasBlackjack) {
            outcome = `Push. Both player and dealer have Blackjack. Bet returned.`
        } else if (playerHasBlackjack) {
            const blackjackPayout = currentBet * 1.5
            outcome = `Blackjack! You win 3:2. +$${blackjackPayout.toFixed(2)}.`
        } else if (dealerHasBlackjack) {
            outcome = `Dealer has Blackjack. You lose -$${currentBet}.`
        } else if (playerTotal > 21) {
            outcome = `Bust! Dealer reveals ${nextDealerCards[1]?.value || dealerCards[1]?.value || 'hidden'} and totals ${dealerTotal}. You lose -$${currentBet}.`
        } else if (dealerTotal > 21) {
            outcome = `Dealer busts with ${dealerTotal}. You win +$${currentBet}.`
        } else if (playerTotal > dealerTotal) {
            outcome = `You win! Player ${playerTotal} to dealer ${dealerTotal}. +$${currentBet}.`
        } else if (playerTotal === dealerTotal) {
            outcome = `Push. Both totals are ${playerTotal}. Bet returned.`
        } else {
            outcome = `Dealer wins ${dealerTotal} to ${playerTotal}. You lose -$${currentBet}.`
        }

        syncPlayerHand(playerCards)
        setHandMessage(outcome)
        hasStartedRef.current = false
        setHasStarted(false)
        setHandComplete(true)
        setSelectedAction('Hit')
    }

    // Split Round Resolution: Handle the resolution of split hands, compare each hand against the dealer's hand, and update state accordingly.
    const resolveSplitAces = async (initialHands, dealerCards) => {
        let hands = initialHands

        // Right hand gets exactly one card automatically
        setActiveSplit(SPLIT_RIGHT)
        setHandMessage('Split aces: dealing to the right hand...')
        await pause(350)

        try {
            hands = await dealToSplitHand(hands, SPLIT_RIGHT)
        } catch (error) {
            console.error(error)
            setHandMessage('Unable to draw a card from the strategy engine. Try again in a moment.')
            return
        }

        await pause(450)

        // Left hand gets exactly one card automatically
        setActiveSplit(SPLIT_LEFT)
        setHandMessage('Split aces: dealing to the left hand...')
        await pause(350)

        try {
            hands = await dealToSplitHand(hands, SPLIT_LEFT)
        } catch (error) {
            console.error(error)
            setHandMessage('Unable to draw a card from the strategy engine. Try again in a moment.')
            return
        }

        await pause(500)

        // Both ace hands are complete
        hands = hands.map((hand) => ({
            ...hand,
            complete: true,
        }))

        syncSplitHands(hands)
        setActiveSplit(null)

        setHandMessage('Split aces complete. Dealer reveals and plays.')
        await pause(500)

        await resolveSplitRound(hands, dealerCards)
    }

    const beginSplitHand = async (hands, handIndex) => {
        setActiveSplit(handIndex)
        setHandMessage(`Playing ${splitHandLabel(handIndex).toLowerCase()}.`)
        await pause(280)

        let nextHands
        try {
            nextHands = await dealToSplitHand(hands, handIndex)
        } catch (error) {
            console.error(error)
            setHandMessage('Unable to draw a card from the strategy engine. Try again in a moment.')
            return null
        }

        const total = getHandTotal(nextHands[handIndex].cards)
        if (total >= 21) {
            nextHands = nextHands.map((entry, index) => (
                index === handIndex ? { ...entry, complete: true } : entry
            ))
            syncSplitHands(nextHands)
            setHandMessage(
                total > 21
                    ? `${splitHandLabel(handIndex)} busts with ${total}.`
                    : `${splitHandLabel(handIndex)} reaches ${total}.`,
            )
            await pause(450)
            return { hands: nextHands, autoComplete: true }
        }

        setHandMessage(`${splitHandLabel(handIndex)} total is ${total}. Make your move.`)
        return { hands: nextHands, autoComplete: false }
    }

    const dealToSplitHand = async (hands, handIndex) => {
        const hand = hands[handIndex]
        const nextCard = await drawPlayerCard(hand.cards.length + handIndex * 4)
        const nextHands = hands.map((entry, index) => (
            index === handIndex
                ? { ...entry, cards: [...entry.cards, nextCard] }
                : entry
        ))
        syncSplitHands(nextHands)
        setLastDrawnCard({ side: 'player', handIndex, key: Date.now() })
        setHandMessage(`${splitHandLabel(handIndex)} receives ${nextCard.value}${nextCard.suit}.`)
        await pause(420)
        return nextHands
    }

    const advanceAfterSplitHand = async (hands, finishedIndex) => {
        const nextHands = hands.map((entry, index) => (
            index === finishedIndex ? { ...entry, complete: true } : entry
        ))
        syncSplitHands(nextHands)

        if (finishedIndex === SPLIT_RIGHT) {
            const leftResult = await beginSplitHand(nextHands, SPLIT_LEFT)
            if (!leftResult) return
            if (leftResult.autoComplete) {
                await resolveSplitRound(leftResult.hands, dealerHandRef.current)
            }
            return
        }

        await resolveSplitRound(nextHands, dealerHandRef.current)
    }

    const resolveSplitRound = async (hands, dealerCards) => {
        const nextDealerCards = await playDealerHand(dealerCards)
        const dealerTotal = getHandTotal(nextDealerCards)
        const right = scoreSplitHand(hands[SPLIT_RIGHT].cards, dealerTotal, hands[SPLIT_RIGHT].bet)
        const left = scoreSplitHand(hands[SPLIT_LEFT].cards, dealerTotal, hands[SPLIT_LEFT].bet)
        const net = right.net + left.net

        setHandMessage(
            `${splitHandLabel(SPLIT_RIGHT)} ${right.summary} (${formatMoney(right.net)}). ` +
            `${splitHandLabel(SPLIT_LEFT)} ${left.summary} (${formatMoney(left.net)}). ` +
            `Net ${formatMoney(net)}.`,
        )

        setSplitAceEnabled(false)
        setActiveSplit(null)
        hasStartedRef.current = false
        setHasStarted(false)
        setHandComplete(true)
        setSelectedAction('Hit')
    }

    const handleActionSelect = async (label, formData) => {
        if (handComplete) return
        if (splitAceModeRef.current) return

        const canSubmit =
            Boolean(formData?.card1) &&
            Boolean(formData?.card2) &&
            Boolean(formData?.dealer) &&
            isValidCardValue(formData.card1) &&
            isValidCardValue(formData.card2) &&
            isValidCardValue(formData.dealer)

        if (!canSubmit) {
            setHandMessage(
                'Enter both player cards and the dealer up card before starting a hand.',
            )
            return
        }

        if (actionLockRef.current) return

        actionLockRef.current = true
        setSelectedAction(label)

        try {
            const roundAlreadyStarted = hasStartedRef.current

            const startingPlayer = roundAlreadyStarted
                ? [...playerHandRef.current]
                : [
                    toCardObject(formData.card1, 0),
                    toCardObject(formData.card2, 1),
                ]

            const startingPlayerHasBlackjackLocal =
                isBlackjack(startingPlayer)

            if (
                !roundAlreadyStarted &&
                startingPlayerHasBlackjackLocal &&
                label !== 'Stand'
            ) {
                return
            }

            const startingDealer = roundAlreadyStarted
                ? [...dealerHandRef.current]
                : [
                    toCardObject(formData.dealer, 0),
                    randomCard(1),
                ]

            if (!roundAlreadyStarted) {
                syncPlayerHand(startingPlayer)
                syncDealerHand(startingDealer)

                setDealerHidden(true)

                hasStartedRef.current = true
                setHasStarted(true)

                setHandComplete(false)

                betRef.current = TABLE_BET
                setBet(TABLE_BET)

                setPlayerBlackjack(startingPlayerHasBlackjackLocal)

                if (
                    startingPlayerHasBlackjackLocal &&
                    label !== 'Split'
                ) {
                    setSelectedAction('Stand')

                    setHandMessage(
                        'Blackjack! Dealer must reveal their hand. Click STAND to continue.',
                    )
                } else if (label !== 'Split') {
                    setHandMessage('Round started. Make your move.')
                }
            }

            const playerCards = [
                ...(roundAlreadyStarted
                    ? playerHandRef.current
                    : startingPlayer),
            ]

            const dealerCards = [
                ...(roundAlreadyStarted
                    ? dealerHandRef.current
                    : startingDealer),
            ]

            /*
             * =========================
             * SPLIT
             * =========================
             */

            if (label === 'Split') {
                const leftCard =
                    playerCards[0] ||
                    toCardObject(formData.card1, 0)

                const rightCard =
                    playerCards[1] ||
                    toCardObject(formData.card2, 1)

                if (
                    !leftCard ||
                    !rightCard ||
                    normalizeCard(leftCard.value) !==
                    normalizeCard(rightCard.value)
                ) {
                    setHandMessage(
                        'Split is only available when both cards match.',
                    )
                    return
                }

                const isSplitAces =
                    normalizeCard(leftCard.value) === 'A'

                const initialHands = [
                    {
                        cards: [leftCard],
                        bet: TABLE_BET,
                        complete: false,
                    },
                    {
                        cards: [rightCard],
                        bet: TABLE_BET,
                        complete: false,
                    },
                ]

                setSplitEnabled(true)
                setSplitAceEnabled(isSplitAces)

                syncSplitHands(initialHands)
                syncPlayerHand([leftCard, rightCard])

                if (isSplitAces) {
                    setHandMessage(
                        'Split aces. Each hand receives one card automatically.',
                    )

                    await pause(400)

                    await resolveSplitAces(
                        initialHands,
                        dealerCards,
                    )

                    return
                }

                setHandMessage(
                    `Split into two $${TABLE_BET} hands. Playing the right hand first.`,
                )

                await pause(350)

                const rightResult = await beginSplitHand(
                    initialHands,
                    SPLIT_RIGHT,
                )

                if (!rightResult) return

                if (rightResult.autoComplete) {
                    await advanceAfterSplitHand(
                        rightResult.hands,
                        SPLIT_RIGHT,
                    )
                }

                return
            }

            /*
             * =========================
             * SPLIT HAND ACTIONS
             * =========================
             */

            if (splitModeRef.current) {
                const handIndex =
                    activeSplitIndexRef.current

                if (handIndex === null) return

                let hands = [...splitHandsRef.current]

                const activeHand = hands[handIndex]

                if (!activeHand || activeHand.complete) return

                /*
                 * HIT SPLIT HAND
                 */

                if (label === 'Hit') {
                    let nextCard

                    try {
                        nextCard = await drawPlayerCard(
                            activeHand.cards.length +
                            handIndex * 4,
                        )
                    } catch (error) {
                        console.error(error)

                        setHandMessage(
                            'Unable to draw a card from the strategy engine. Try again in a moment.',
                        )

                        return
                    }

                    hands = hands.map((entry, index) =>
                        index === handIndex
                            ? {
                                ...entry,
                                cards: [
                                    ...entry.cards,
                                    nextCard,
                                ],
                            }
                            : entry,
                    )

                    syncSplitHands(hands)

                    setLastDrawnCard({
                        side: 'player',
                        handIndex,
                        key: Date.now(),
                    })

                    await pause(420)

                    const total = getHandTotal(
                        hands[handIndex].cards,
                    )

                    if (total >= 21) {
                        setHandMessage(
                            total > 21
                                ? `${splitHandLabel(
                                    handIndex,
                                )} hits for ${nextCard.value}${nextCard.suit} and busts with ${total}.`
                                : `${splitHandLabel(
                                    handIndex,
                                )} hits for ${nextCard.value}${nextCard.suit} and reaches ${total}.`,
                        )

                        await pause(400)

                        await advanceAfterSplitHand(
                            hands,
                            handIndex,
                        )

                        return
                    }

                    setHandMessage(
                        `${splitHandLabel(
                            handIndex,
                        )} hits for ${nextCard.value}${nextCard.suit}. Total is ${total}.`,
                    )

                    return
                }

                /*
                 * STAND SPLIT HAND
                 */

                if (label === 'Stand') {
                    const total = getHandTotal(
                        activeHand.cards,
                    )

                    setHandMessage(
                        `${splitHandLabel(
                            handIndex,
                        )} stands with ${total}.`,
                    )

                    await pause(350)

                    await advanceAfterSplitHand(
                        hands,
                        handIndex,
                    )

                    return
                }

                /*
                 * DOUBLE DOWN SPLIT HAND
                 */

                if (label === 'Double Down') {
                    let nextCard

                    try {
                        nextCard = await drawPlayerCard(
                            activeHand.cards.length +
                            handIndex * 4,
                        )
                    } catch (error) {
                        console.error(error)

                        setHandMessage(
                            'Unable to draw a card from the strategy engine. Try again in a moment.',
                        )

                        return
                    }

                    hands = hands.map((entry, index) =>
                        index === handIndex
                            ? {
                                ...entry,
                                cards: [
                                    ...entry.cards,
                                    nextCard,
                                ],
                                bet: entry.bet * 2,
                            }
                            : entry,
                    )

                    syncSplitHands(hands)

                    setLastDrawnCard({
                        side: 'player',
                        handIndex,
                        key: Date.now(),
                    })

                    const total = getHandTotal(
                        hands[handIndex].cards,
                    )

                    setHandMessage(
                        `${splitHandLabel(
                            handIndex,
                        )} doubles for ${nextCard.value}${nextCard.suit}. Total ${total}.`,
                    )

                    await pause(420)

                    await advanceAfterSplitHand(
                        hands,
                        handIndex,
                    )

                    return
                }

                return
            }

            /*
             * =========================
             * NORMAL HIT
             * =========================
             */

            if (label === 'Hit') {
                let nextCard

                try {
                    nextCard = await drawPlayerCard(
                        playerCards.length,
                    )
                } catch (error) {
                    console.error(error)

                    setHandMessage(
                        'Unable to draw a card from the strategy engine. Try again in a moment.',
                    )

                    return
                }

                const nextPlayerCards = [
                    ...playerCards,
                    nextCard,
                ]

                setLastDrawnCard({
                    side: 'player',
                    key: Date.now(),
                })

                syncPlayerHand(nextPlayerCards)

                setHandMessage(
                    `Player hits for ${nextCard.value}${nextCard.suit}.`,
                )

                await pause(420)

                const playerTotal =
                    getHandTotal(nextPlayerCards)

                if (playerTotal >= 21) {
                    await resolveDealerRound(
                        nextPlayerCards,
                        dealerCards,
                        betRef.current,
                    )

                    return
                }

                setHandMessage(
                    `Player hits for ${nextCard.value}${nextCard.suit}. Total is ${playerTotal}.`,
                )

                return
            }

            /*
             * =========================
             * NORMAL STAND
             * =========================
             */

            if (label === 'Stand') {
                await resolveDealerRound(
                    playerCards,
                    dealerCards,
                    betRef.current,
                )

                return
            }

            /*
             * =========================
             * NORMAL DOUBLE DOWN
             * =========================
             */

            if (label === 'Double Down') {
                let nextCard

                try {
                    nextCard = await drawPlayerCard(
                        playerCards.length,
                    )
                } catch (error) {
                    console.error(error)

                    setHandMessage(
                        'Unable to draw a card from the strategy engine. Try again in a moment.',
                    )

                    return
                }

                const doubledBet =
                    betRef.current * 2

                const nextPlayerCards = [
                    ...playerCards,
                    nextCard,
                ]

                setLastDrawnCard({
                    side: 'player',
                    key: Date.now(),
                })

                syncPlayerHand(nextPlayerCards)

                betRef.current = doubledBet
                setBet(doubledBet)

                setHandMessage(
                    `Double down: ${nextCard.value}${nextCard.suit}.`,
                )

                await pause(420)

                await resolveDealerRound(
                    nextPlayerCards,
                    dealerCards,
                    doubledBet,
                )
            }
        } finally {
            actionLockRef.current = false
        }
    }

    const resetGame = () => {
        playerHandRef.current = []
        dealerHandRef.current = []

        splitHandsRef.current = []
        activeSplitIndexRef.current = null

        hasStartedRef.current = false
        betRef.current = TABLE_BET

        splitModeRef.current = false
        splitAceModeRef.current = false

        actionLockRef.current = false

        setPlayerHand([])
        setDealerHand([])
        setResolvedPlayerHand([])
        setResolvedDealerHand([])

        setHandComplete(false)
        setHasStarted(false)

        setHandMessage('Ready for the next hand.')

        setBet(TABLE_BET)
        setLastDrawnCard(null)
        setPlayerBlackjack(false)

        setSplitMode(false)
        setSplitHands([])
        setActiveSplitIndex(null)
        setSplitAceMode(false)

        setSelectedAction('Hit')
    }

    const replayGame = (formData) => {
        const startingPlayer = [
            toCardObject(formData.card1, 0),
            toCardObject(formData.card2, 1),
        ]

        const startingDealer = [
            toCardObject(formData.dealer, 0),
            randomCard(1),
        ]

        playerHandRef.current = startingPlayer
        dealerHandRef.current = startingDealer

        setPlayerHand(startingPlayer)
        setDealerHand(startingDealer)

        setResolvedPlayerHand(startingPlayer)
        setResolvedDealerHand(startingDealer)

        setDealerHidden(true)

        hasStartedRef.current = false
        betRef.current = TABLE_BET

        setHasStarted(false)
        setHandComplete(false)
        setBet(TABLE_BET)
        setPlayerBlackjack(false)

        splitModeRef.current = false
        splitHandsRef.current = []
        activeSplitIndexRef.current = null
        splitAceModeRef.current = false

        setSplitMode(false)
        setSplitHands([])
        setActiveSplitIndex(null)
        setSplitAceMode(false)

        setSelectedAction('Hit')
        setLastDrawnCard(null)

        setHandMessage(
            'Hand reset. Replay with the same cards, or make your move.'
        )
    }

    return {
        playerHand,
        dealerHand,
        dealerHidden,
        resolvedPlayerHand,
        resolvedDealerHand,

        setPlayerHand,
        setDealerHand,
        setResolvedPlayerHand,
        setResolvedDealerHand,

        syncPlayerHand,
        syncDealerHand,

        playerHandRef,
        dealerHandRef,

        splitMode,
        splitHands,
        activeSplitIndex,
        splitAceMode,

        selectedAction,
        setSelectedAction,

        syncSplitHands,
        setActiveSplit,
        setSplitEnabled,
        setSplitAceEnabled,

        splitModeRef,
        splitHandsRef,
        activeSplitIndexRef,
        splitAceModeRef,

        handComplete,
        hasStarted,
        handMessage,
        bet,
        lastDrawnCard,
        playerBlackjack,

        // Game logic
        playDealerHand,
        resolveDealerRound,
        resolveSplitRound,
        dealToSplitHand,
        resolveSplitAces,
        beginSplitHand,
        advanceAfterSplitHand,
        handleActionSelect,
        resetGame,
        replayGame,
    }
}