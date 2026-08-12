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

  // A blackjack is always displayed as its winning total, not as 11 / 21.
  if (total === 21 || aceCount === 0) return `${total}`

  // Once the 11-value Ace would put the hand above 21, only the hard total applies.
  return softTotal <= 21 ? `${hardTotal} / ${softTotal}` : `${total}`
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
  const [result, setResult] = useState({
    recommendedMove: '',
    bustPercentage: null,
    dealerBustPercentage: null,
    dealerMakesHandPercentage: null,
    expectedValue: null,
    explanation: '',
  })
  const [loading, setLoading] = useState(false)
  const [inputWarning, setInputWarning] = useState('')
  const [handComplete, setHandComplete] = useState(false)

  // Flip animation flags for when inputs become valid
  const [flipPlayer1, setFlipPlayer1] = useState(false)
  const [flipPlayer2, setFlipPlayer2] = useState(false)
  const [flipDealer, setFlipDealer] = useState(false)
  const prevFormRef = useRef(defaultForm)
  const playerHandRef = useRef([])
  const dealerHandRef = useRef([])
  const hasStartedRef = useRef(false)
  const betRef = useRef(TABLE_BET)
  const actionLockRef = useRef(false)

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

  // When an input transitions from empty -> valid, briefly trigger a flip animation
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

  const resolveDealerRound = async (playerCards, dealerCards, currentBet) => {
    // Keep the finished player hand visible while the dealer plays out.
    syncPlayerHand(playerCards)

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

    const playerTotal = getHandTotal(playerCards)
    let outcome = ''

    if (playerTotal > 21) {
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
    syncDealerHand(nextDealerCards)
    setHandMessage(outcome)
    hasStartedRef.current = false
    setHasStarted(false)
    setHandComplete(true)
    setSelectedAction('Hit')
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
    hasStartedRef.current = false
    setHasStarted(false)
    betRef.current = TABLE_BET
    setBet(TABLE_BET)
    setSelectedAction('Hit')
    actionLockRef.current = false
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
    setResult({
      recommendedMove: '',
      bustPercentage: null,
      dealerBustPercentage: null,
      dealerMakesHandPercentage: null,
      expectedValue: null,
      explanation: '',
    })
    setInputWarning('')
    setFlipPlayer1(false)
    setFlipPlayer2(false)
    setFlipDealer(false)
    prevFormRef.current = { ...defaultForm }
    setHandMessage('Ready for the next hand.')
  }

  const handleActionSelect = async (label) => {
    if (handComplete) return
    if (!canSubmit) {
      setHandMessage('Enter both player cards and the dealer up card before starting a hand.')
      return
    }
    if (label === 'Split' && !isSplitAvailable) return
    if (label === 'Double Down' && hasStartedRef.current) return
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
        syncPlayerHand(startingPlayer)
        syncDealerHand(startingDealer)
        setDealerHidden(true)
        hasStartedRef.current = true
        setHasStarted(true)
        setHandComplete(false)
        betRef.current = TABLE_BET
        setBet(TABLE_BET)
        setHandMessage('Round started. Make your move.')
      }

      const playerCards = [...(roundAlreadyStarted ? playerHandRef.current : startingPlayer)]
      const dealerCards = [...(roundAlreadyStarted ? dealerHandRef.current : startingDealer)]

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
        return
      }

      if (label === 'Split') {
        const firstCard = normalizeCard(formData.card1)
        const secondCard = normalizeCard(formData.card2)
        if (firstCard !== secondCard) {
          setHandMessage('Split is only available when both cards match.')
          return
        }

        const splitText = `Split selected: ${firstCard} and ${secondCard} are matched. Each hand plays as a $${TABLE_BET} bet.`
        setHandMessage(splitText)
        hasStartedRef.current = false
        setHasStarted(false)
        setHandComplete(false)
        setSelectedAction('Hit')
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
  const hasValidInput = Boolean(formData.card1) && Boolean(formData.card2) && Boolean(formData.dealer)
  const activePlayerHand = playerHand.length >= resolvedPlayerHand.length ? playerHand : resolvedPlayerHand
  const activeDealerHand = dealerHand.length >= resolvedDealerHand.length ? dealerHand : resolvedDealerHand
  const playerCardsToRender = (hasStarted || handComplete || activePlayerHand.length > 0)
    ? activePlayerHand
    : [formData.card1 ? toCardObject(formData.card1, 0) : null, formData.card2 ? toCardObject(formData.card2, 1) : null]
  const dealerCardsToRender = (hasStarted || handComplete || activeDealerHand.length > 0 || !dealerHidden)
    ? activeDealerHand
    : [formData.dealer ? toCardObject(formData.dealer, 0) : null, null]
  const playerTotal = playerCardsToRender.some(Boolean) ? getDisplayedPlayerTotal(playerCardsToRender.filter(Boolean)) : null
  const dealerCardsForTotal = dealerHidden ? dealerCardsToRender.slice(0, 1) : dealerCardsToRender
  const dealerTotal = dealerCardsForTotal.some(Boolean) ? getHandTotal(dealerCardsForTotal.filter(Boolean)) : null
  const isSplitAvailable = normalizeCard(formData.card1) === normalizeCard(formData.card2) && Boolean(formData.card1) && Boolean(formData.card2)
  const playerHasTwentyOne = hasStarted && getHandTotal(playerHand) >= 21
  const canDoubleDown = !hasStarted && !handComplete
  const canSubmit = [...[formData.card1, formData.card2, formData.dealer]].every((value) => Boolean(value) && isValidCardValue(value))
  const actionsDisabled = handComplete

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

          <div className="player-row">
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
                    (lastDrawnCard?.side === 'player' && index === playerCardsToRender.length - 1)
                  }
                />
              ))}
            </div>

            <div className="board-meta player-meta">
              <div className={`meta-score ${playerTotal?.includes('/') ? 'soft-total' : ''}`}>{playerTotal || ''}</div>
              <div className="meta-name">Player</div>
            </div>
          </div>
        </div>

        <div className="action-strip">
          {actionLabels.map((label) => {
            const isSplit = label === 'Split'
            const isDoubleDown = label === 'Double Down'
            const isHit = label === 'Hit'
            const disabled = actionsDisabled || !canSubmit || (isSplit && !isSplitAvailable) || (isDoubleDown && !canDoubleDown) || (isHit && playerHasTwentyOne)
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
