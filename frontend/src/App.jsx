import { useState } from 'react'
import './App.css'

const defaultForm = {
  card1: '10',
  card2: '6',
  dealer: '9',
}

const validCardValues = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K']
const API_URL = import.meta.env.DEV ? '/api/recommend' : 'http://localhost:8080/api/recommend'
const actionLabels = ['Hit', 'Stand', 'Double', 'Split']
const suitOrder = ['♣', '♦', '♥', '♠']
const suitColors = {
  '♥': '#d9305d',
  '♦': '#d9305d',
  '♣': '#111827',
  '♠': '#111827',
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

function formatCardInput(value) {
  const cleaned = value.replace(/[^a-zA-Z0-9]/g, '').slice(0, 2).toUpperCase()
  if (!cleaned) return ''
  return cleaned
}

function getCardTotal(values) {
  return values.reduce((total, rawValue) => {
    if (!rawValue) return total

    const value = normalizeCard(rawValue)
    if (!value || !isValidCardValue(value)) return total
    if (value === 'A') return total + 11
    if (['K', 'Q', 'J'].includes(value)) return total + 10
    const asNumber = Number(value)
    return total + (Number.isNaN(asNumber) ? 0 : asNumber)
  }, 0)
}

function getCardFace(value, index) {
  if (!value || value === '?') {
    return { rank: '?', suit: '', hidden: true }
  }

  const normalized = normalizeCard(value)
  const rank = normalized
  const suit = suitOrder[(normalized.charCodeAt(0) + index) % suitOrder.length]

  return { rank, suit, hidden: false }
}

function CardSlot({ value, index = 0, hidden = false }) {
  const card = hidden ? { rank: '', suit: '', hidden: true } : getCardFace(value, index)

  if (card.hidden) {
    return (
      <div className="card-slot hidden-card" aria-label="Hidden card">
        <div className="card-back-pattern" />
      </div>
    )
  }

  const suitColor = suitColors[card.suit] || '#111827'

  return (
    <div className="card-slot visible-card">
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
  )
}

function App() {
  const [formData, setFormData] = useState(defaultForm)
  const [selectedAction, setSelectedAction] = useState('Hit')
  const [result, setResult] = useState({
    recommendedMove: 'Hit',
    bustPercentage: 0.61,
    dealerBustPercentage: 0.23,
    dealerMakesHandPercentage: 0.78,
    expectedValue: -0.5,
    explanation: 'AI coach explanation will appear here once the hand is analyzed.',
  })
  const [loading, setLoading] = useState(false)
  const [inputWarning, setInputWarning] = useState('')

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

  const handleActionSelect = (label) => {
    if (label === 'Split' && !isSplitAvailable) return
    setSelectedAction(label)
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
      setResult((current) => ({
        ...current,
        explanation: 'Unable to reach the strategy engine, try again in a moment.',
      }))
    } finally {
      setLoading(false)
    }
  }

  const moveLabel = result.recommendedMove.toUpperCase()
  const playerTotal = getCardTotal([formData.card1, formData.card2]) || 18
  const dealerTotal = getCardTotal([formData.dealer]) || 6
  const isSplitAvailable = String(formData.card1).trim().toUpperCase() === String(formData.card2).trim().toUpperCase()
  const canSubmit = [formData.card1, formData.card2, formData.dealer].every((value) => Boolean(value) && isValidCardValue(value))

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
          <div className="top-label player-label">
            John
          </div>
          <div className="top-label menu-label">MENU</div>
        </div>

        <div className="board-area">
          <div className="dealer-row">
            <div className="board-cards">
              <CardSlot value={formData.dealer} index={0} />
              <CardSlot value="?" index={1} hidden />
            </div>

            <div className="board-meta">
              <div className="meta-score">{dealerTotal}</div>
              <div className="meta-name">Dealer</div>
            </div>
          </div>

          <div className="player-row">
            <div className="board-cards">
              <CardSlot value={formData.card1} index={2} />
              <CardSlot value={formData.card2} index={3} />
            </div>

            <div className="board-meta player-meta">
              <div className="meta-score">{playerTotal}</div>
              <div className="meta-name">Player</div>
            </div>
          </div>
        </div>

        <div className="action-strip">
          {actionLabels.map((label) => {
            const isSplit = label === 'Split'
            const disabled = isSplit && !isSplitAvailable

            const isSelected = selectedAction === label && !disabled

            return (
              <button
                key={label}
                type="button"
                className={`action-button ${label.toLowerCase()} ${disabled ? 'disabled' : ''} ${isSelected ? 'selected' : ''}`}
                disabled={disabled}
                aria-pressed={isSelected}
                onClick={() => handleActionSelect(label)}
              >
                <span>{label}</span>
              </button>
            )
          })}
        </div>
      </div>

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
          <div className="stat-tile">
            <span>Bust chance</span>
            <strong>{(result.bustPercentage * 100).toFixed(1)}%</strong>
          </div>
          <div className="stat-tile">
            <span>Dealer bust</span>
            <strong>{(result.dealerBustPercentage * 100).toFixed(1)}%</strong>
          </div>
          <div className="stat-tile">
            <span>Dealer makes hand</span>
            <strong>{(result.dealerMakesHandPercentage * 100).toFixed(1)}%</strong>
          </div>
          <div className="stat-tile">
            <span>Expected value</span>
            <strong>{Number(result.expectedValue).toFixed(2)}</strong>
          </div>
        </div>

        <p className="explanation">{result.explanation}</p>
      </div>
    </div>
  )
}

export default App
