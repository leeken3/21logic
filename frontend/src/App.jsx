import { useState } from 'react'
import './App.css'

const defaultForm = {
  card1: '10',
  card2: '6',
  dealer: '9',
}

const actionLabels = ['Fold', 'Stand', 'Split', 'Hit', 'Double']

function CardSlot({ value, isDealer = false }) {
  const resolved = value || '?'
  const cardClass = `card-slot ${isDealer ? 'dealer-card' : 'player-card'}`

  return <div className={cardClass}>{resolved}</div>
}

function App() {
  const [formData, setFormData] = useState(defaultForm)
  const [result, setResult] = useState({
    recommendedMove: 'Hit',
    bustPercentage: 0.61,
    dealerBustPercentage: 0.23,
    dealerMakesHandPercentage: 0.78,
    expectedValue: -0.5,
    explanation: 'AI coach explanation will appear here once the hand is analyzed.',
  })
  const [loading, setLoading] = useState(false)

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData((current) => ({ ...current, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/recommend', {
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

  return (
    <div className="app-shell">
      <div className="top-strip">
        <span>MIN</span>
        <span>MAX</span>
        <span className="table-pill">Table 301</span>
      </div>

      <div className="table-surface">
        <div className="dealer-zone">
          <div className="dealer-header">Dealer upcard</div>
          <div className="cards-inline">
            <CardSlot value={formData.dealer} isDealer />
            <CardSlot value="?" />
          </div>
        </div>

        <div className="center-badge">
          <span className="badge-label">21</span>
          <span className="badge-text">Blackjack</span>
        </div>

        <div className="player-zone">
          <div className="cards-inline player-inline">
            <CardSlot value={formData.card1} />
            <CardSlot value={formData.card2} />
          </div>
        </div>

        <div className="player-roster">
          <div className="seat seat-left">
            <div className="avatar avatar-one" />
            <div className="seat-info">
              <strong>125K</strong>
              <span>Gus</span>
            </div>
          </div>
          <div className="seat seat-right">
            <div className="avatar avatar-two" />
            <div className="seat-info">
              <strong>636.4K</strong>
              <span>John</span>
            </div>
          </div>
        </div>
      </div>

      <div className="control-panel">
        <div className="action-grid">
          {actionLabels.map((label) => (
            <button key={label} type="button" className="action-button">
              {label}
            </button>
          ))}
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
              <span>Dealer Up</span>
              <input name="dealer" value={formData.dealer} onChange={handleChange} maxLength="2" />
            </label>
          </div>

          <button type="submit" className="primary-button" disabled={loading}>
            {loading ? 'Calculating…' : 'Get recommendation'}
          </button>
        </form>
      </div>

      <div className="result-panel">
        <div className="result-header">
          <span>Recommendation</span>
          <strong>{moveLabel}</strong>
        </div>

        <div className="stats-grid">
          <div>
            <span>Bust chance</span>
            <strong>{(result.bustPercentage * 100).toFixed(1)}%</strong>
          </div>
          <div>
            <span>Dealer bust</span>
            <strong>{(result.dealerBustPercentage * 100).toFixed(1)}%</strong>
          </div>
          <div>
            <span>Dealer makes hand</span>
            <strong>{(result.dealerMakesHandPercentage * 100).toFixed(1)}%</strong>
          </div>
          <div>
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
