import { useEffect, useRef, useState } from 'react'
import './App.css'

import {
  getRecommendation,
} from './services/blackjackApi'

import {
  normalizeCard,
  isValidCardValue,
  toCardObject,
  getHandTotal,
  isBlackjack,
  getDisplayedPlayerTotal,
} from './utils/blackjack'

import { useBlackjackGame } from './hooks/useBlackjackGame'

import ActionBar from './components/ActionBar'
import RecommendationPanel from './components/RecommendationPanel'
import CardInputForm from './components/CardInputForm'
import GameBoard from './components/GameBoard'
import HandResultPanel from './components/HandResultPanel'
import BasicStrategyBoard from './components/BasicStrategyBoard'

const defaultForm = {
  card1: '',
  card2: '',
  dealer: '',
}

const emptyResult = {
  recommendedMove: '',
  bustPercentage: null,
  dealerBustPercentage: null,
  dealerMakesHandPercentage: null,
  expectedValue: null,
  explanation: '',
}

/**
 * Main application component for the Blackjack strategy tool.
 * @returns {React.JSX.Element}
 * @constructor
 */
function App() {
  const {
    playerHand,
    dealerHand,
    dealerHidden,
    resolvedPlayerHand,
    resolvedDealerHand,

    splitMode,
    splitHands,
    activeSplitIndex,
    splitAceMode,

    selectedAction,

    handComplete,
    hasStarted,
    handMessage,
    lastDrawnCard,
    playerBlackjack,

    // Game logic
    handleActionSelect,
    resetGame,
    replayGame,
  } = useBlackjackGame()
  const [formData, setFormData] = useState(defaultForm)
  const [result, setResult] = useState(emptyResult)
  const [loading, setLoading] = useState(false)
  const [inputWarning, setInputWarning] = useState('')

  const [appView, setAppView] = useState('practice')
  const [optionsOpen, setOptionsOpen] = useState(false)

  const [flipPlayer1, setFlipPlayer1] = useState(false)
  const [flipPlayer2, setFlipPlayer2] = useState(false)
  const [flipDealer, setFlipDealer] = useState(false)
  const prevFormRef = useRef(defaultForm)

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

  const handleReplayHand = () => {
    if (!canSubmit) return

    replayGame(formData)

    setFlipPlayer1(false)
    setFlipPlayer2(false)
    setFlipDealer(false)

    setHandMessage(
        'Hand reset. Replay with the same cards, or make your move.'
    )
  }

  const handleRefresh = () => {
    resetGame()

    setFormData(defaultForm)
    setResult(emptyResult)
    setInputWarning('')

    setFlipPlayer1(false)
    setFlipPlayer2(false)
    setFlipDealer(false)

    prevFormRef.current = { ...defaultForm }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)

    try {
      const payload = await getRecommendation(formData)

      setResult({
        recommendedMove: payload.recommendedMove || 'Hit',
        bustPercentage: payload.bustPercentage || 0,
        dealerBustPercentage: payload.dealerBustPercentage || 0,
        dealerMakesHandPercentage:
            payload.dealerMakesHandPercentage || 0,
        expectedValue: payload.expectedValue || 0,
        explanation:
            payload.explanation || 'No explanation available.',
      })
    } catch (error) {
      console.error(error)
      setHandMessage(
          'Unable to reach the strategy engine, try again in a moment.',
      )
    } finally {
      setLoading(false)
    }
  }

  const activePlayerHand = playerHand.length >= resolvedPlayerHand.length ? playerHand : resolvedPlayerHand
  const activeDealerHand = dealerHand.length >= resolvedDealerHand.length ? dealerHand : resolvedDealerHand
  const playerCardsToRender = (hasStarted || handComplete || activePlayerHand.length > 0)
    ? activePlayerHand
    : [formData.card1 ? toCardObject(formData.card1, 0) : null, formData.card2 ? toCardObject(formData.card2, 1) : null]
  const dealerCardsToRender =
      activeDealerHand.length > 0
          ? activeDealerHand
          : [
            formData.dealer || null,
            null,
          ]
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
          </div>

          <div className="options-wrapper">
            <button
                type="button"
                className={`top-label menu-label options-button ${optionsOpen ? 'open' : ''}`}
                onClick={() => setOptionsOpen((current) => !current)}
            >
              Options
            </button>

            {optionsOpen && (
                <div className="options-menu">
                  <button
                      type="button"
                      className={appView === 'practice' ? 'active' : ''}
                      onClick={() => {
                        setAppView('practice')
                        setOptionsOpen(false)
                      }}
                  >
                    Practice
                  </button>

                  <button
                      type="button"
                      className={appView === 'strategy' ? 'active' : ''}
                      onClick={() => {
                        setAppView('strategy')
                        setOptionsOpen(false)
                      }}
                  >
                    Basic Strategy
                  </button>
                </div>
            )}
          </div>
        </div>

        {appView === 'practice' ? (
            <>
              <GameBoard
                  dealerCardsToRender={dealerCardsToRender}
                  dealerHidden={dealerHidden}
                  dealerTotal={dealerTotal}
                  flipDealer={flipDealer}
                  lastDrawnCard={lastDrawnCard}
                  showSplitBoard={showSplitBoard}
                  playerCardsToRender={playerCardsToRender}
                  playerTotal={playerTotal}
                  flipPlayer1={flipPlayer1}
                  flipPlayer2={flipPlayer2}
                  splitHands={splitHands}
                  activeSplitIndex={activeSplitIndex}
                  handComplete={handComplete}
              />

              <ActionBar
                  onAction={(label) => handleActionSelect(label, formData)}
                  selectedAction={selectedAction}
                  disabled={actionsDisabled}
                  canSubmit={canSubmit}
                  startingPlayerHasBlackjack={startingPlayerHasBlackjack}
                  isSplitAvailable={isSplitAvailable}
                  canDoubleDown={canDoubleDown}
                  playerHasTwentyOne={playerHasTwentyOne}
              />
            </>
        ) : (
            <BasicStrategyBoard />
        )}

      </div>

      {appView === 'practice' && (
          <>
            <HandResultPanel
                handMessage={handMessage}
                handComplete={handComplete}
                onReplay={handleReplayHand}
                onRefresh={handleRefresh}
            />

            <CardInputForm
                formData={formData}
                inputWarning={inputWarning}
                loading={loading}
                canSubmit={canSubmit}
                onChange={handleChange}
                onSubmit={handleSubmit}
            />

            <RecommendationPanel result={result} />
          </>
      )}
    </div>
  )
}

export default App
