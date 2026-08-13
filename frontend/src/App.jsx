import { useEffect, useRef, useState } from 'react'
import './App.css'

const defaultForm = {
  card1: '',
  card2: '',
  dealer: '',
}

const validCardValues = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K']
const API_URL = import.meta.env.DEV ? '/api/recommend' : 'http://localhost:8080/api/recommend'
const DRAW_API_URL = import.meta.env.DEV ? '/api/draw' : 'http://localhost:8080/api/draw'
const actionLabels = ['Hit', 'Stand', 'Double Down', 'Split']
const actionDescriptions = {
  Hit: 'Take another card to improve your hand while staying under 21.',
  Stand: 'Keep your current total and end your turn without drawing another card.',
  'Double Down': 'Double your wager and take exactly one more card to maximize value.',
  Split: 'Split matching cards into two separate hands and play each one independently.',
}
const suitOrder = ['♣', '♦', '♥', '♠']
const suitColors = {
  '♥': '#d9305d',
  '♦': '#d9305d',
  '♣': '#111827',
  '♠': '#111827',
}
const deckValues = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K']
const TABLE_BET = 10
const SPLIT_RIGHT = 1
const SPLIT_LEFT = 0
const emptyResult = {
  recommendedMove: '',
  bustPercentage: null,
  dealerBustPercentage: null,
  dealerMakesHandPercentage: null,
  expectedValue: null,
  explanation: '',
}

function normalizeCard(value) {
  const cleaned = value?.toString().trim().toUpperCase()
  if (!cleaned) return ''
  if (cleaned === '1') return 'A'
  return cleaned
}

function isValidCardValue(value) {
  const normalized = normalizeCard(value)
  return validCardValues.includes(normalized)
}

function toCardObject(value, index = 0) {
  const normalized = normalizeCard(value)
  if (!normalized) return null
  const suit = suitOrder[(normalized.charCodeAt(0) + index) % suitOrder.length]
  return { value: normalized, suit }
}

function randomCard(index = 0) {
  const value = deckValues[Math.floor(Math.random() * deckValues.length)]
  const suit = suitOrder[(Math.floor(Math.random() * suitOrder.length) + index) % suitOrder.length]
  return { value, suit }
}

function getHandTotal(cards) {
  let total = cards.reduce((sum, rawCard) => {
    const card = rawCard && typeof rawCard === 'object' ? rawCard : toCardObject(rawCard)
    if (!card) return sum

    const value = normalizeCard(card.value)
    if (value === 'A') return sum + 11
    if (['K', 'Q', 'J'].includes(value)) return sum + 10
    const parsed = Number(value)
    return sum + (Number.isNaN(parsed) ? 0 : parsed)
  }, 0)

  let aces = cards.filter((rawCard) => normalizeCard(rawCard && typeof rawCard === 'object' ? rawCard.value : rawCard) === 'A').length
  while (total > 21 && aces > 0) {
    total -= 10
    aces -= 1
  }

  return total
}

function isBlackjack(cards) {
  if (!cards || cards.length !== 2) return false

  const values = cards.map((card) =>
      normalizeCard(card && typeof card === 'object' ? card.value : card),
  )

  const hasAce = values.includes('A')
  const hasTenValue = values.some((value) => ['10', 'J', 'Q', 'K'].includes(value))

  return hasAce && hasTenValue
}

function getDisplayedPlayerTotal(cards) {
  const total = getHandTotal(cards)
  const aceCount = cards.filter((rawCard) => normalizeCard(rawCard && typeof rawCard === 'object' ? rawCard.value : rawCard) === 'A').length
  const hardTotal = cards.reduce((sum, rawCard) => {
    const value = normalizeCard(rawCard && typeof rawCard === 'object' ? rawCard.value : rawCard)
    if (value === 'A') return sum + 1
    if (['K', 'Q', 'J'].includes(value)) return sum + 10
    const numericValue = Number(value)
    return sum + (Number.isNaN(numericValue) ? 0 : numericValue)
  }, 0)
  const softTotal = aceCount > 0 ? hardTotal + 10 : hardTotal

  if (total === 21 || aceCount === 0) return `${total}`
  return softTotal <= 21 ? `${hardTotal} / ${softTotal}` : `${total}`
}

function formatMoney(amount) {
  if (amount > 0) return `+$${amount}`
  if (amount < 0) return `-$${Math.abs(amount)}`
  return '$0'
}

function scoreSplitHand(cards, dealerTotal, bet) {
  const playerTotal = getHandTotal(cards)
  if (playerTotal > 21) {
    return { summary: `busts with ${playerTotal}`, net: -bet }
  }
  if (dealerTotal > 21) {
    return { summary: `wins ${playerTotal} (dealer bust)`, net: bet }
  }
  if (playerTotal > dealerTotal) {
    return { summary: `wins ${playerTotal} to ${dealerTotal}`, net: bet }
  }
  if (playerTotal === dealerTotal) {
    return { summary: `pushes at ${playerTotal}`, net: 0 }
  }
  return { summary: `loses ${playerTotal} to ${dealerTotal}`, net: -bet }
}

function splitHandLabel(index) {
  return index === SPLIT_RIGHT ? 'Right hand' : 'Left hand'
}

function getCardFace(value, index) {
  const safeValue = value && typeof value === 'object' ? value.value : normalizeCard(value)
  if (!safeValue || safeValue === '?') {
    return { rank: '?', suit: '', hidden: true }
  }

  const normalized = normalizeCard(safeValue)
  const rank = normalized
  const suit = value && typeof value === 'object' ? value.suit : suitOrder[(normalized.charCodeAt(0) + index) % suitOrder.length]

  return { rank, suit, hidden: false }
}

function CardSlot({ value, index = 0, hidden = false, animate = false }) {
  const card = hidden ? { rank: '', suit: '', hidden: true } : getCardFace(value, index)
  const suitColor = suitColors[card.suit] || '#111827'

  return (
    <div className={`card-slot ${animate ? 'card-deal' : ''}`} aria-label={card.hidden ? 'Hidden card' : `${card.rank}${card.suit}`}>
      <div className={`card-inner ${card.hidden ? 'is-face-down' : ''} ${animate ? 'card-animate' : ''}`}>
        <div className="card-face card-front">
          <span className="card-rank top-left" style={{ color: suitColor }}>
            {card.rank}
          </span>
          <span className="card-suit center" style={{ color: suitColor }}>
            {card.suit}
          </span>
          <span className="card-rank bottom-right" style={{ color: suitColor }}>
            {card.rank}
          </span>
        </div>
        <div className="card-face card-back">
          <div className="card-back-pattern" />
        </div>
      </div>
    </div>
  )
}

function App() {
  const [formData, setFormData] = useState(defaultForm)
  const [selectedAction, setSelectedAction] = useState('Hit')
  const [playerHand, setPlayerHand] = useState([])
  const [dealerHand, setDealerHand] = useState([])
  const [resolvedPlayerHand, setResolvedPlayerHand] = useState([])
  const [resolvedDealerHand, setResolvedDealerHand] = useState([])
  const [dealerHidden, setDealerHidden] = useState(true)
  const [hasStarted, setHasStarted] = useState(false)
  const [lastDrawnCard, setLastDrawnCard] = useState(null)
  const [handMessage, setHandMessage] = useState('Ready for the next hand.')
  const [bet, setBet] = useState(TABLE_BET)
  const [result, setResult] = useState(emptyResult)
  const [loading, setLoading] = useState(false)
  const [inputWarning, setInputWarning] = useState('')
  const [handComplete, setHandComplete] = useState(false)
  const [playerBlackjack, setPlayerBlackjack] = useState(false)
  const [splitMode, setSplitMode] = useState(false)
  const [splitHands, setSplitHands] = useState([])
  const [activeSplitIndex, setActiveSplitIndex] = useState(null)
  const [splitAceMode, setSplitAceMode] = useState(false)

  const [flipPlayer1, setFlipPlayer1] = useState(false)
  const [flipPlayer2, setFlipPlayer2] = useState(false)
  const [flipDealer, setFlipDealer] = useState(false)
  const prevFormRef = useRef(defaultForm)
  const playerHandRef = useRef([])
  const dealerHandRef = useRef([])
  const hasStartedRef = useRef(false)
  const betRef = useRef(TABLE_BET)
  const actionLockRef = useRef(false)
  const splitModeRef = useRef(false)
  const splitHandsRef = useRef([])
  const activeSplitIndexRef = useRef(null)
  const splitAceModeRef = useRef(false)

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

  const handleChange = (event) => {
    const { name, value } = event.target
    const cleaned = value.replace(/[^a-zA-Z0-9]/g, '').slice(0, 2).toUpperCase()
    const nextValue = cleaned || ''

    if (nextValue && !isValidCardValue(nextValue)) {
      setInputWarning(`Invalid card value: "${nextValue}". Use A, 2-10, J, Q, or K.`)
      return
    }

    setInputWarning('')
    setFormData((current) => ({ ...current, [name]: nextValue }))
  }

  const pause = (duration) => new Promise((resolve) => setTimeout(resolve, duration))

  const drawPlayerCard = async (index) => {
    const response = await fetch(DRAW_API_URL, { method: 'POST' })
    if (!response.ok) throw new Error('Card draw request failed')

    const payload = await response.json()
    const value = normalizeCard(payload.rank)
    if (!isValidCardValue(value)) throw new Error('Strategy engine returned an invalid card')

    return toCardObject(value, index)
  }

  useEffect(() => {
    const prev = prevFormRef.current || { card1: '', card2: '', dealer: '' }

    if (!prev.card1 && formData.card1) {
      setFlipPlayer1(true)
      setTimeout(() => setFlipPlayer1(false), 700)
    }
    if (!prev.card2 && formData.card2) {
      setFlipPlayer2(true)
      setTimeout(() => setFlipPlayer2(false), 700)
    }
    if (!prev.dealer && formData.dealer) {
      setFlipDealer(true)
      setTimeout(() => setFlipDealer(false), 700)
    }

    prevFormRef.current = { ...formData }
  }, [formData.card1, formData.card2, formData.dealer])

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

  const resetTableHands = () => {
    playerHandRef.current = []
    dealerHandRef.current = []
    setPlayerHand([])
    setDealerHand([])
    setResolvedPlayerHand([])
    setResolvedDealerHand([])
    setDealerHidden(true)
    setLastDrawnCard(null)
    setPlayerBlackjack(false)
    hasStartedRef.current = false
    setHasStarted(false)
    betRef.current = TABLE_BET
    setBet(TABLE_BET)
    setSelectedAction('Hit')
    actionLockRef.current = false
    setSplitEnabled(false)
    setSplitAceEnabled(false)
    syncSplitHands([])
    setActiveSplit(null)
  }

  const handleReplayHand = () => {
    if (!canSubmit) return

    resetTableHands()
    setHandComplete(false)
    setFlipPlayer1(false)
    setFlipPlayer2(false)
    setFlipDealer(false)
    setHandMessage('Hand reset. Replay with the same cards, or make your move.')
  }

  const handleRefresh = () => {
    resetTableHands()
    setHandComplete(false)
    setFormData(defaultForm)
    setResult(emptyResult)
    setInputWarning('')
    setFlipPlayer1(false)
    setFlipPlayer2(false)
    setFlipDealer(false)
    prevFormRef.current = { ...defaultForm }
    setHandMessage('Ready for the next hand.')
  }

  const handleActionSelect = async (label) => {
    if (handComplete) return
    if (splitAceModeRef.current) return
    if (startingPlayerHasBlackjack && label !== 'Stand') return

    if (!canSubmit) {
      setHandMessage('Enter both player cards and the dealer up card before starting a hand.')
      return
    }
    if (label === 'Split' && (!isSplitAvailable || splitModeRef.current)) return
    if (label === 'Double Down' && hasStartedRef.current && !splitModeRef.current) return
    if (label === 'Double Down' && splitModeRef.current) {
      const active = splitHandsRef.current[activeSplitIndexRef.current]
      if (!active || active.complete || active.cards.length !== 2) return
    }
    if (actionLockRef.current) return

    actionLockRef.current = true
    setSelectedAction(label)

    try {
      const roundAlreadyStarted = hasStartedRef.current
      const startingPlayer = roundAlreadyStarted
        ? [...playerHandRef.current]
        : [toCardObject(formData.card1, 0), toCardObject(formData.card2, 1)]
      const startingDealer = roundAlreadyStarted
        ? [...dealerHandRef.current]
        : [toCardObject(formData.dealer, 0), randomCard(1)]

      if (!roundAlreadyStarted) {
        const startingPlayerHasBlackjack = isBlackjack(startingPlayer)

        syncPlayerHand(startingPlayer)
        syncDealerHand(startingDealer)
        setDealerHidden(true)
        hasStartedRef.current = true
        setHasStarted(true)
        setHandComplete(false)
        betRef.current = TABLE_BET
        setBet(TABLE_BET)
        setPlayerBlackjack(startingPlayerHasBlackjack)

        if (startingPlayerHasBlackjack && label !== 'Split') {
          setSelectedAction('Stand')
          setHandMessage('Blackjack! Dealer must reveal their hand. Click STAND to continue.')
        } else if (label !== 'Split') {
          setHandMessage('Round started. Make your move.')
        }
      }

      const playerCards = [...(roundAlreadyStarted ? playerHandRef.current : startingPlayer)]
      const dealerCards = [...(roundAlreadyStarted ? dealerHandRef.current : startingDealer)]

      if (label === 'Split') {
        const leftCard = playerCards[0] || toCardObject(formData.card1, 0)
        const rightCard = playerCards[1] || toCardObject(formData.card2, 1)

        if (!leftCard || !rightCard || normalizeCard(leftCard.value) !== normalizeCard(rightCard.value)) {
          setHandMessage('Split is only available when both cards match.')
          return
        }

        const isSplitAces = normalizeCard(leftCard.value) === 'A'

        const initialHands = [
          { cards: [leftCard], bet: TABLE_BET, complete: false },
          { cards: [rightCard], bet: TABLE_BET, complete: false },
        ]

        setSplitEnabled(true)
        setSplitAceEnabled(isSplitAces)
        syncSplitHands(initialHands)
        syncPlayerHand([leftCard, rightCard])

        if (isSplitAces) {
          setHandMessage('Split aces. Each hand receives one card automatically.')
          await pause(400)

          await resolveSplitAces(initialHands, dealerCards)
          return
        }

        setHandMessage(`Split into two $${TABLE_BET} hands. Playing the right hand first.`)
        await pause(350)

        const rightResult = await beginSplitHand(initialHands, SPLIT_RIGHT)

        if (!rightResult) return

        if (rightResult.autoComplete) {
          await advanceAfterSplitHand(rightResult.hands, SPLIT_RIGHT)
        }

        return
      }

      if (splitModeRef.current) {
        const handIndex = activeSplitIndexRef.current
        if (handIndex === null) return
        let hands = [...splitHandsRef.current]
        const activeHand = hands[handIndex]
        if (!activeHand || activeHand.complete) return

        if (label === 'Hit') {
          let nextCard
          try {
            nextCard = await drawPlayerCard(activeHand.cards.length + handIndex * 4)
          } catch (error) {
            console.error(error)
            setHandMessage('Unable to draw a card from the strategy engine. Try again in a moment.')
            return
          }

          hands = hands.map((entry, index) => (
            index === handIndex
              ? { ...entry, cards: [...entry.cards, nextCard] }
              : entry
          ))
          syncSplitHands(hands)
          setLastDrawnCard({ side: 'player', handIndex, key: Date.now() })
          await pause(420)

          const total = getHandTotal(hands[handIndex].cards)
          if (total >= 21) {
            setHandMessage(
              total > 21
                ? `${splitHandLabel(handIndex)} hits for ${nextCard.value}${nextCard.suit} and busts with ${total}.`
                : `${splitHandLabel(handIndex)} hits for ${nextCard.value}${nextCard.suit} and reaches ${total}.`,
            )
            await pause(400)
            await advanceAfterSplitHand(hands, handIndex)
            return
          }

          setHandMessage(`${splitHandLabel(handIndex)} hits for ${nextCard.value}${nextCard.suit}. Total is ${total}.`)
          return
        }

        if (label === 'Stand') {
          const total = getHandTotal(activeHand.cards)
          setHandMessage(`${splitHandLabel(handIndex)} stands with ${total}.`)
          await pause(350)
          await advanceAfterSplitHand(hands, handIndex)
          return
        }

        if (label === 'Double Down') {
          let nextCard
          try {
            nextCard = await drawPlayerCard(activeHand.cards.length + handIndex * 4)
          } catch (error) {
            console.error(error)
            setHandMessage('Unable to draw a card from the strategy engine. Try again in a moment.')
            return
          }

          hands = hands.map((entry, index) => (
            index === handIndex
              ? { ...entry, cards: [...entry.cards, nextCard], bet: entry.bet * 2 }
              : entry
          ))
          syncSplitHands(hands)
          setLastDrawnCard({ side: 'player', handIndex, key: Date.now() })
          const total = getHandTotal(hands[handIndex].cards)
          setHandMessage(`${splitHandLabel(handIndex)} doubles for ${nextCard.value}${nextCard.suit}. Total ${total}.`)
          await pause(420)
          await advanceAfterSplitHand(hands, handIndex)
          return
        }

        return
      }

      if (label === 'Hit') {
        let nextCard
        try {
          nextCard = await drawPlayerCard(playerCards.length)
        } catch (error) {
          console.error(error)
          setHandMessage('Unable to draw a card from the strategy engine. Try again in a moment.')
          return
        }
        const nextPlayerCards = [...playerCards, nextCard]
        setLastDrawnCard({ side: 'player', key: Date.now() })
        syncPlayerHand(nextPlayerCards)
        setHandMessage(`Player hits for ${nextCard.value}${nextCard.suit}.`)
        await pause(420)

        const playerTotal = getHandTotal(nextPlayerCards)
        if (playerTotal >= 21) {
          await resolveDealerRound(nextPlayerCards, dealerCards, betRef.current)
          return
        }

        setHandMessage(`Player hits for ${nextCard.value}${nextCard.suit}. Total is ${playerTotal}.`)
        return
      }

      if (label === 'Stand') {
        await resolveDealerRound(playerCards, dealerCards, betRef.current)
        return
      }

      if (label === 'Double Down') {
        let nextCard
        try {
          nextCard = await drawPlayerCard(playerCards.length)
        } catch (error) {
          console.error(error)
          setHandMessage('Unable to draw a card from the strategy engine. Try again in a moment.')
          return
        }
        const doubledBet = betRef.current * 2
        const nextPlayerCards = [...playerCards, nextCard]
        setLastDrawnCard({ side: 'player', key: Date.now() })
        syncPlayerHand(nextPlayerCards)
        betRef.current = doubledBet
        setBet(doubledBet)
        setHandMessage(`Double down: ${nextCard.value}${nextCard.suit}.`)
        await pause(420)
        await resolveDealerRound(nextPlayerCards, dealerCards, doubledBet)
      }
    } finally {
      actionLockRef.current = false
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)

    try {
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

      const payload = await response.json()
      setResult({
        recommendedMove: payload.recommendedMove || 'Hit',
        bustPercentage: payload.bustPercentage || 0,
        dealerBustPercentage: payload.dealerBustPercentage || 0,
        dealerMakesHandPercentage: payload.dealerMakesHandPercentage || 0,
        expectedValue: payload.expectedValue || 0,
        explanation: payload.explanation || 'No explanation available.',
      })
    } catch (error) {
      console.error(error)
      setHandMessage('Unable to reach the strategy engine, try again in a moment.')
    } finally {
      setLoading(false)
    }
  }

  const moveLabel = result.recommendedMove?.toUpperCase() || ''
  const activePlayerHand = playerHand.length >= resolvedPlayerHand.length ? playerHand : resolvedPlayerHand
  const activeDealerHand = dealerHand.length >= resolvedDealerHand.length ? dealerHand : resolvedDealerHand
  const playerCardsToRender = (hasStarted || handComplete || activePlayerHand.length > 0)
    ? activePlayerHand
    : [formData.card1 ? toCardObject(formData.card1, 0) : null, formData.card2 ? toCardObject(formData.card2, 1) : null]
  const dealerCardsToRender = (hasStarted || handComplete || activeDealerHand.length > 0 || !dealerHidden)
    ? activeDealerHand
    : [formData.dealer ? toCardObject(formData.dealer, 0) : null, null]
  const playerTotal = playerCardsToRender.some(Boolean)
      ? isBlackjack(playerCardsToRender.filter(Boolean))
          ? 'BJ'
          : getDisplayedPlayerTotal(playerCardsToRender.filter(Boolean))
      : null
  const dealerCardsForTotal = dealerHidden ? dealerCardsToRender.slice(0, 1) : dealerCardsToRender
  const dealerTotal = dealerCardsForTotal.some(Boolean) ? getHandTotal(dealerCardsForTotal.filter(Boolean)) : null
  const isPair = normalizeCard(formData.card1) === normalizeCard(formData.card2) && Boolean(formData.card1) && Boolean(formData.card2)

  const startingPlayerCards = [
    formData.card1 ? toCardObject(formData.card1, 0) : null,
    formData.card2 ? toCardObject(formData.card2, 1) : null,
  ].filter(Boolean)

  const startingPlayerHasBlackjack = isBlackjack(startingPlayerCards)
  const isSplitAvailable =
      isPair &&
      !playerBlackjack &&
      !splitMode &&
      (!hasStarted || playerHand.length === 2)
  const activeSplitHand = splitMode && activeSplitIndex !== null ? splitHands[activeSplitIndex] : null
  const playerHasTwentyOne = splitMode
    ? Boolean(activeSplitHand && getHandTotal(activeSplitHand.cards) >= 21)
    : hasStarted && getHandTotal(playerHand) >= 21
  const canDoubleDown = splitMode
      ? Boolean(activeSplitHand && !activeSplitHand.complete && activeSplitHand.cards.length === 2)
      : (!hasStarted && !handComplete && !startingPlayerHasBlackjack)
  const canSubmit = [formData.card1, formData.card2, formData.dealer].every((value) => Boolean(value) && isValidCardValue(value))
  const actionsDisabled = handComplete || splitAceMode
  const showSplitBoard = splitMode && splitHands.length === 2

  const renderSplitHand = (handIndex) => {
    const hand = splitHands[handIndex]
    if (!hand) return null
    const isActive = activeSplitIndex === handIndex && !handComplete
    const total = hand.cards.length ? getDisplayedPlayerTotal(hand.cards) : ''

    return (
      <div className={`split-hand ${isActive ? 'is-active' : ''} ${hand.complete ? 'is-complete' : ''}`}>
        <div className="split-hand-label">
          <span>{handIndex === SPLIT_RIGHT ? 'Right' : 'Left'}</span>
          <span className="split-hand-bet">${hand.bet}</span>
        </div>
        <div className="board-cards split-hand-cards">
          {hand.cards.map((card, index) => (
            <CardSlot
              key={`split-${handIndex}-${index}`}
              value={card}
              index={handIndex * 4 + index + 2}
              hidden={!card}
              animate={lastDrawnCard?.side === 'player' && lastDrawnCard?.handIndex === handIndex && index === hand.cards.length - 1}
            />
          ))}
        </div>
        <div className={`meta-score split-hand-score ${String(total).includes('/') ? 'soft-total' : ''}`}>
          {total}
        </div>
      </div>
    )
  }

  return (
    <div className="app-shell">
      <header className="brand-bar" aria-label="21Logic brand">
        <div className="brand-mark" aria-hidden="true">
          <span className="chip-center">21</span>
        </div>
        <div className="brand-copy">
          <span className="brand-kicker">Blackjack strategy</span>
          <h1 className="page-title">21 Logic</h1>
        </div>
      </header>

      <div className="table-surface">
        <div className="table-topbar">
          <div className="top-label player-label">John</div>
          <div className="top-label menu-label">Log Out</div>
        </div>

        <div className="board-area">
          <div className="dealer-row">
            <div className="board-cards">
              {dealerCardsToRender.map((card, index) => (
                <CardSlot
                  key={`dealer-${index}`}
                  value={card}
                  index={index}
                  hidden={!card || (index === 1 && dealerHidden)}
                  animate={flipDealer || (lastDrawnCard?.side === 'dealer' && index === dealerCardsToRender.length - 1)}
                />
              ))}
            </div>

            <div className="board-meta">
              <div className="meta-score">{dealerTotal !== null ? dealerTotal : ''}</div>
              <div className="meta-name">Dealer</div>
            </div>
          </div>

          <div className={`player-row ${showSplitBoard ? 'is-split' : ''}`}>
            {showSplitBoard ? (
              <div className="split-board">
                {renderSplitHand(SPLIT_LEFT)}
                <div className="split-divider" aria-hidden="true" />
                {renderSplitHand(SPLIT_RIGHT)}
              </div>
            ) : (
              <>
                <div className="board-cards">
                  {playerCardsToRender.map((card, index) => (
                    <CardSlot
                      key={`player-${index}`}
                      value={card}
                      index={index + 2}
                      hidden={!card}
                      animate={
                        (index === 0 && flipPlayer1) ||
                        (index === 1 && flipPlayer2) ||
                        (lastDrawnCard?.side === 'player' && lastDrawnCard?.handIndex == null && index === playerCardsToRender.length - 1)
                      }
                    />
                  ))}
                </div>

                <div className="board-meta player-meta">
                  <div className={`meta-score ${playerTotal?.includes('/') ? 'soft-total' : ''}`}>{playerTotal || ''}</div>
                  <div className="meta-name">Player</div>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="action-strip">
          {actionLabels.map((label) => {
            const isSplit = label === 'Split'
            const isDoubleDown = label === 'Double Down'
            const isHit = label === 'Hit'
            const disabled = actionsDisabled
                || !canSubmit
                || (startingPlayerHasBlackjack && label !== 'Stand')
                || (isSplit && !isSplitAvailable)
                || (isDoubleDown && !canDoubleDown)
                || (isHit && playerHasTwentyOne)
            const isSelected = selectedAction === label && !disabled

            return (
              <div key={label} className="action-button-wrap">
                <button
                  type="button"
                  className={`action-button ${label === 'Double Down' ? 'double' : label.toLowerCase()} ${disabled ? 'disabled' : ''} ${isSelected ? 'selected' : ''}`}
                  disabled={disabled}
                  aria-pressed={isSelected}
                  onClick={() => handleActionSelect(label)}
                >
                  <span>{label}</span>
                </button>
                <div className="action-help" tabIndex={0} aria-label={`${label} help`}>
                  ?
                  <span className="action-help-tooltip">{actionDescriptions[label]}</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {handMessage && (
        <div className={`hand-result-panel ${handComplete ? 'with-actions' : ''}`}>
          <p>{handMessage}</p>
          {handComplete && (
            <div className="hand-result-actions">
              <button type="button" className="hand-control-button" onClick={handleReplayHand}>
                Replay Hand
              </button>
              <button type="button" className="hand-control-button" onClick={handleRefresh}>
                Refresh
              </button>
            </div>
          )}
        </div>
      )}

      <form className="input-card" onSubmit={handleSubmit}>
        <div className="field-grid">
          <label>
            <span>Player Card 1</span>
            <input name="card1" value={formData.card1} onChange={handleChange} maxLength="2" />
          </label>
          <label>
            <span>Player Card 2</span>
            <input name="card2" value={formData.card2} onChange={handleChange} maxLength="2" />
          </label>
          <label>
            <span>Dealer Up Card</span>
            <input name="dealer" value={formData.dealer} onChange={handleChange} maxLength="2" />
          </label>
        </div>

        {inputWarning && <div className="input-warning">{inputWarning}</div>}

        <button type="submit" className="primary-button" disabled={loading || !canSubmit}>
          {loading ? 'Calculating…' : 'Get recommendation'}
        </button>
      </form>

      <div className="result-panel">
        <div className="result-header">
          <div className="result-label-block">
            <span className="result-kicker">Recommendation</span>
            <span className="result-subtitle">Best play</span>
          </div>
          <div className="move-pill">
            <strong>{moveLabel}</strong>
          </div>
        </div>

        <div className="stats-grid">
          {[
            {
              label: 'Bust chance',
              description: 'Chance that your current hand will bust if you take another card.',
              value: result.bustPercentage !== null ? `${(result.bustPercentage * 100).toFixed(1)}%` : '—',
            },
            {
              label: 'Dealer bust',
              description: 'Probability the dealer goes over 21 after the deal is complete.',
              value: result.dealerBustPercentage !== null ? `${(result.dealerBustPercentage * 100).toFixed(1)}%` : '—',
            },
            {
              label: 'Dealer makes hand',
              description: 'Likelihood the dealer finishes with a playable hand instead of busting.',
              value: result.dealerMakesHandPercentage !== null ? `${(result.dealerMakesHandPercentage * 100).toFixed(1)}%` : '—',
            },
            {
              label: 'Expected value',
              description: 'Average profit or loss for this decision based on the current odds.',
              value: result.expectedValue !== null ? Number(result.expectedValue).toFixed(2) : '—',
            },
          ].map(({ label, description, value }) => (
            <div key={label} className="stat-tile" title={description}>
              <span>{label}</span>
              <strong>{value}</strong>
              <div className="stat-tooltip">{description}</div>
            </div>
          ))}
        </div>

        <p className="explanation">{result.explanation}</p>
      </div>
    </div>
  )
}

export default App
