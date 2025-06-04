'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import StatsPopup from '../components/stats-popup'
import { WORDLIST } from '../constants'

// Get the same word sequence for the same day
function getDailySequence(): string[] {
    const today = new Date()
    const startOfYear = new Date(today.getFullYear(), 0, 1)
    const dayOfYear =
        Math.floor(
            (today.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24)
        ) + 1

    // Use day of year as direct index, wrapping around if needed
    const index = (dayOfYear - 1) % WORDLIST.length
    return WORDLIST[index]
}

// Get today's date string for comparison
function getTodayDateString(): string {
    const today = new Date()
    return (
        today.getFullYear() +
        '-' +
        String(today.getMonth() + 1).padStart(2, '0') +
        '-' +
        String(today.getDate()).padStart(2, '0')
    )
}

// Get a random word sequence for practice mode (excluding today's)
function getRandomPracticeSequence(): string[] {
    const today = new Date()
    const startOfYear = new Date(today.getFullYear(), 0, 1)
    const dayOfYear =
        Math.floor(
            (today.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24)
        ) + 1
    const todayIndex = (dayOfYear - 1) % WORDLIST.length

    // Get a random index that's not today's index
    let randomIndex
    do {
        randomIndex = Math.floor(Math.random() * WORDLIST.length)
    } while (randomIndex === todayIndex)

    return WORDLIST[randomIndex]
}

// Save game state to localStorage
function saveGameState(state: {
    currentWordSequence: string[]
    currentWordIndex: number
    userInput: string[]
    attemptsPerWord: number[]
    date: string
}) {
    try {
        localStorage.setItem('wordAssociationGame', JSON.stringify(state))
    } catch (error) {
        console.warn('Failed to save game state to localStorage:', error)
    }
}

// Load game state from localStorage
function loadGameState(): {
    currentWordSequence: string[]
    currentWordIndex: number
    userInput: string[]
    attemptsPerWord: number[]
    date: string
} | null {
    try {
        const saved = localStorage.getItem('wordAssociationGame')
        if (saved) {
            const parsed = JSON.parse(saved)
            // Ensure attemptsPerWord exists for backward compatibility
            if (!parsed.attemptsPerWord) {
                parsed.attemptsPerWord = Array(
                    parsed.currentWordSequence.length - 1
                ).fill(0)
            }
            return parsed
        }
    } catch (error) {
        console.warn('Failed to load game state from localStorage:', error)
    }
    return null
}

const RevealedLetterTile = ({ letter }: { letter: string }) => (
    <div className='flex h-14 w-14 items-center justify-center rounded bg-green-600 text-3xl font-bold text-white sm:h-16 sm:w-16'>
        {letter}
    </div>
)

const FirstLetterTile = ({
    letter,
    className = '',
}: {
    letter: string
    className?: string
}) => (
    <div
        className={`flex h-14 w-14 items-center justify-center rounded border border-zinc-500 bg-zinc-600 text-3xl font-bold text-white sm:h-16 sm:w-16 ${className}`}
    >
        {letter}
    </div>
)

const InputTile = (
    props: React.InputHTMLAttributes<HTMLInputElement> & { className?: string }
) => (
    <input
        {...props}
        type='text'
        maxLength={1}
        className={`h-14 w-14 rounded border border-zinc-600 bg-zinc-700/70 p-2 text-center text-3xl font-bold text-white focus:border-blue-500 focus:outline-none sm:h-16 sm:w-16 ${props.className}`}
        readOnly
    />
)

const PlaceholderTile = () => (
    <div className='h-14 w-14 rounded border border-zinc-600 bg-zinc-700/70 sm:h-16 sm:w-16' />
)

// Simple Confetti Particle Component
const ConfettiParticle = () => {
    const colors = [
        'bg-yellow-400',
        'bg-pink-400',
        'bg-green-500',
        'bg-blue-400',
        'bg-purple-400',
        'bg-red-400',
    ]
    const randomColor = colors[Math.floor(Math.random() * colors.length)]
    const style = useMemo(
        () => ({
            left: `${Math.random() * 100}%`,
            animationDuration: `${Math.random() * 2 + 3}s`, // 3-5 seconds
            animationDelay: `${Math.random() * 2}s`, // 0-2 seconds delay
        }),
        []
    )

    return <div className={`confetti-particle ${randomColor}`} style={style} />
}

// Confetti Effect Component
const ConfettiEffect = ({ count = 50 }: { count?: number }) => {
    return (
        <>
            <style jsx global>{`
                .confetti-particle {
                    position: absolute;
                    top: -10px; /* Start above screen */
                    width: 10px;
                    height: 10px;
                    border-radius: 2px;
                    opacity: 0.8;
                    animation: fall linear forwards;
                }
                @keyframes fall {
                    0% {
                        transform: translateY(0) rotate(0deg);
                        opacity: 1;
                    }
                    100% {
                        transform: translateY(100vh)
                            rotate(${Math.random() * 720}deg); /* Fall to bottom of viewport and rotate */
                        opacity: 0;
                    }
                }
            `}</style>
            {Array.from({ length: count }).map((_, index) => (
                <ConfettiParticle key={index} />
            ))}
        </>
    )
}

const KEYBOARD_LAYOUT = [
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
    ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'BACKSPACE'],
]

const Key = ({
    keyValue,
    onClick,
    className = '',
}: {
    keyValue: string
    onClick: () => void
    className?: string
}) => {
    let displayValue = keyValue
    if (keyValue === 'BACKSPACE') {
        displayValue = '⌫' // Or an SVG icon
    }
    return (
        <button
            onClick={onClick}
            className={`m-0.5 flex h-12 items-center justify-center rounded bg-zinc-600 p-2 text-lg font-medium text-white hover:bg-zinc-400 active:bg-zinc-600 sm:h-14 sm:text-xl ${className}`}
        >
            {displayValue}
        </button>
    )
}

const VirtualKeyboard = ({
    onKeyPress,
    onEnterPress,
    onBackspacePress,
}: {
    onKeyPress: (key: string) => void
    onEnterPress: () => void
    onBackspacePress: () => void
}) => {
    return (
        <div className='mt-8 w-full max-w-lg flex-col items-center justify-center select-none'>
            {KEYBOARD_LAYOUT.map((row, rowIndex) => (
                <div key={rowIndex} className='flex w-full justify-center'>
                    {row.map((keyVal) => {
                        let keyClassName = 'flex-1'
                        if (keyVal === 'ENTER' || keyVal === 'BACKSPACE') {
                            keyClassName =
                                'min-w-[calc(12.5%-4px)] flex-grow-[1.5]' // Adjust flex-grow for wider keys
                        } else {
                            keyClassName = 'min-w-[calc(10%-4px)] flex-grow' // Assuming 10 keys max per row, with margin
                        }

                        return (
                            <Key
                                key={keyVal}
                                keyValue={keyVal}
                                onClick={() => {
                                    if (keyVal === 'ENTER') onEnterPress()
                                    else if (keyVal === 'BACKSPACE')
                                        onBackspacePress()
                                    else onKeyPress(keyVal)
                                }}
                                className={keyClassName}
                            />
                        )
                    })}
                </div>
            ))}
        </div>
    )
}

export default function WordAssociationGame() {
    const [currentWordSequence, setCurrentWordSequence] = useState<string[]>([])
    const [currentWordIndex, setCurrentWordIndex] = useState(0)
    const [userInput, setUserInput] = useState<string[]>([])
    const [attemptsPerWord, setAttemptsPerWord] = useState<number[]>([])
    const [isShaking, setIsShaking] = useState(false)
    const [showConfetti, setShowConfetti] = useState(false)
    const [showStatsPopup, setShowStatsPopup] = useState(false)
    const [isPracticeMode, setIsPracticeMode] = useState(false)
    const [dailyCompleted, setDailyCompleted] = useState(false)

    const handleInputChange = useCallback(
        (index: number, value: string) => {
            if (
                /^[a-zA-Z]$/.test(value) &&
                index >= 0 &&
                index < userInput.length
            ) {
                const newUserInput = [...userInput]
                newUserInput[index] = value.toUpperCase()
                setUserInput(newUserInput)

                if (index < userInput.length - 1) {
                    setTimeout(
                        () =>
                            document
                                .getElementById(`input-${index + 1}`)
                                ?.focus(),
                        0
                    )
                } else if (index === userInput.length - 1) {
                    setTimeout(
                        () =>
                            document.getElementById(`input-${index}`)?.focus(),
                        0
                    )
                }
            }
        },
        [userInput]
    )

    const handleSubmit = useCallback(() => {
        if (currentWordIndex >= currentWordSequence.length - 1) return
        const wordToGuess = currentWordSequence[currentWordIndex + 1]
        if (!wordToGuess) return

        const firstLetter = wordToGuess[0]?.toUpperCase() || ''
        const guessedWord = (firstLetter + userInput.join('')).toUpperCase()

        // Increment attempts for current word (for both correct and incorrect guesses)
        const newAttemptsPerWord = [...attemptsPerWord]
        newAttemptsPerWord[currentWordIndex] =
            (newAttemptsPerWord[currentWordIndex] || 0) + 1
        setAttemptsPerWord(newAttemptsPerWord)

        if (guessedWord === wordToGuess.toUpperCase()) {
            const newCurrentWordIndex = currentWordIndex + 1
            setCurrentWordIndex(newCurrentWordIndex)
            if (newCurrentWordIndex < currentWordSequence.length - 1) {
                const nextWordToSetUp =
                    currentWordSequence[newCurrentWordIndex + 1]
                const newUserInput = Array(
                    nextWordToSetUp.length > 0 ? nextWordToSetUp.length - 1 : 0
                ).fill('')
                setUserInput(newUserInput)

                // Save progress to localStorage
                if (!isPracticeMode) {
                    saveGameState({
                        currentWordSequence,
                        currentWordIndex: newCurrentWordIndex,
                        userInput: newUserInput,
                        attemptsPerWord: newAttemptsPerWord,
                        date: getTodayDateString(),
                    })
                }

                setTimeout(() => document.getElementById('input-0')?.focus(), 0)
            } else {
                setUserInput([])
                if (isPracticeMode) {
                    setShowConfetti(true)
                    setTimeout(() => {
                        setShowConfetti(false)
                    }, 3000)
                } else {
                    setDailyCompleted(true)
                    setShowConfetti(true)
                    setTimeout(() => {
                        setShowStatsPopup(true)
                    }, 1000)

                    // Save completed state (only for daily mode)
                    saveGameState({
                        currentWordSequence,
                        currentWordIndex: newCurrentWordIndex,
                        userInput: [],
                        attemptsPerWord: newAttemptsPerWord,
                        date: getTodayDateString(),
                    })
                }
            }
        } else {
            setIsShaking(true)
            setTimeout(() => setIsShaking(false), 600)
            setUserInput(
                Array(wordToGuess.length > 0 ? wordToGuess.length - 1 : 0).fill(
                    ''
                )
            )
            setTimeout(() => document.getElementById('input-0')?.focus(), 0)
        }
    }, [
        currentWordIndex,
        currentWordSequence,
        userInput,
        attemptsPerWord,
        isPracticeMode,
    ])

    const initializeGame = useCallback(() => {
        if (isPracticeMode) {
            // Start a new practice game with random sequence
            const practiceSequence = getRandomPracticeSequence()
            setCurrentWordSequence(practiceSequence)
            setCurrentWordIndex(0)
            setAttemptsPerWord(Array(practiceSequence.length - 1).fill(0))
            setIsShaking(false)
            setShowConfetti(false)
            setShowStatsPopup(false)

            if (practiceSequence.length > 1 && practiceSequence[1]) {
                const initialUserInput = Array(
                    practiceSequence[1].length > 0
                        ? practiceSequence[1].length - 1
                        : 0
                ).fill('')
                setUserInput(initialUserInput)
            } else {
                setUserInput([])
            }

            setTimeout(() => document.getElementById('input-0')?.focus(), 0)
            return
        }

        const todayDate = getTodayDateString()
        const savedState = loadGameState()

        // Check if we have a saved state for today's date
        if (savedState && savedState.date === todayDate) {
            // Restore saved state
            setCurrentWordSequence(savedState.currentWordSequence)
            setCurrentWordIndex(savedState.currentWordIndex)
            setUserInput(savedState.userInput)
            setAttemptsPerWord(savedState.attemptsPerWord)
            const isCompleted =
                savedState.currentWordIndex >=
                savedState.currentWordSequence.length - 1

            setDailyCompleted(isCompleted)
            setIsShaking(false)

            // Show confetti if game was already completed
            if (isCompleted) {
                setShowConfetti(true)
                setTimeout(() => {
                    setShowStatsPopup(true)
                }, 1000)
            } else {
                setShowConfetti(false)
            }
        } else {
            // Start fresh game for today
            const newSequence = getDailySequence()
            setCurrentWordSequence(newSequence)
            setCurrentWordIndex(0)
            setAttemptsPerWord(Array(newSequence.length - 1).fill(0))
            setDailyCompleted(false)
            setIsShaking(false)
            setShowConfetti(false)
            if (newSequence.length > 1 && newSequence[1]) {
                const initialUserInput = Array(
                    newSequence[1].length > 0 ? newSequence[1].length - 1 : 0
                ).fill('')
                setUserInput(initialUserInput)

                // Save initial state
                saveGameState({
                    currentWordSequence: newSequence,
                    currentWordIndex: 0,
                    userInput: initialUserInput,
                    attemptsPerWord: Array(newSequence.length - 1).fill(0),
                    date: todayDate,
                })
            } else {
                setUserInput([])
            }
        }
        setTimeout(() => document.getElementById('input-0')?.focus(), 0)
    }, [isPracticeMode])

    useEffect(() => {
        initializeGame()
    }, [initializeGame])

    const handlePracticeMode = useCallback(() => {
        setShowStatsPopup(false)
        setShowConfetti(false)
        setIsPracticeMode(true)

        // Generate new practice sequence immediately
        const practiceSequence = getRandomPracticeSequence()
        setCurrentWordSequence(practiceSequence)
        setCurrentWordIndex(0)
        setAttemptsPerWord(Array(practiceSequence.length - 1).fill(0))

        if (practiceSequence.length > 1 && practiceSequence[1]) {
            const initialUserInput = Array(
                practiceSequence[1].length > 0
                    ? practiceSequence[1].length - 1
                    : 0
            ).fill('')
            setUserInput(initialUserInput)
        } else {
            setUserInput([])
        }

        setTimeout(() => document.getElementById('input-0')?.focus(), 0)
    }, [])

    const handleVirtualKeyPress = useCallback(
        (key: string) => {
            const firstTrulyEmptyIndex = userInput.findIndex(
                (char) => char === ''
            )
            if (firstTrulyEmptyIndex !== -1) {
                handleInputChange(firstTrulyEmptyIndex, key)
            }
        },
        [userInput, handleInputChange]
    )

    const handleVirtualBackspacePress = useCallback(() => {
        setUserInput((prevUserInput) => {
            const newUserInput = [...prevUserInput]
            let lastFilledIndex = -1
            for (let i = newUserInput.length - 1; i >= 0; i--) {
                if (newUserInput[i] !== '') {
                    lastFilledIndex = i
                    break
                }
            }

            if (lastFilledIndex !== -1) {
                newUserInput[lastFilledIndex] = ''
                setTimeout(
                    () =>
                        document
                            .getElementById(`input-${lastFilledIndex}`)
                            ?.focus(),
                    0
                )
                return newUserInput
            }
            return prevUserInput
        })
    }, [])

    const handleVirtualEnterPress = useCallback(() => {
        handleSubmit()
    }, [handleSubmit])

    useEffect(() => {
        const handleGlobalKeyDown = (event: KeyboardEvent) => {
            if (showConfetti) return

            const key = event.key.toUpperCase()

            if (key.length === 1 && key >= 'A' && key <= 'Z') {
                event.preventDefault()
                handleVirtualKeyPress(key)
            } else if (event.key === 'Backspace') {
                event.preventDefault()
                handleVirtualBackspacePress()
            } else if (event.key === 'Enter') {
                event.preventDefault()
                handleVirtualEnterPress()
            }
        }

        document.addEventListener('keydown', handleGlobalKeyDown)
        return () => {
            document.removeEventListener('keydown', handleGlobalKeyDown)
        }
    }, [
        showConfetti,
        handleVirtualKeyPress,
        handleVirtualBackspacePress,
        handleVirtualEnterPress,
    ])

    if (currentWordSequence.length === 0) {
        return <div>Loading game...</div>
    }

    const totalAttempts = attemptsPerWord.reduce(
        (sum, attempts) => sum + attempts,
        0
    )

    return (
        <div className='relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-zinc-900 p-4 text-white'>
            {showConfetti && <ConfettiEffect />}
            <StatsPopup
                isOpen={showStatsPopup && !isPracticeMode}
                onClose={() => setShowStatsPopup(false)}
                attemptsPerWord={attemptsPerWord}
                totalAttempts={totalAttempts}
                currentWordSequence={currentWordSequence}
                onPracticeMode={handlePracticeMode}
            />
            <style jsx global>{`
                @keyframes shake {
                    0%,
                    100% {
                        transform: translateX(0);
                    }
                    12.5% {
                        transform: translateX(-3px);
                    }
                    25% {
                        transform: translateX(3px);
                    }
                    37.5% {
                        transform: translateX(-3px);
                    }
                    50% {
                        transform: translateX(3px);
                    }
                    62.5% {
                        transform: translateX(-3px);
                    }
                    75% {
                        transform: translateX(3px);
                    }
                    87.5% {
                        transform: translateX(-3px);
                    }
                }
                .shake {
                    animation: shake 0.6s ease-in-out;
                }
            `}</style>
            <div className='mb-4 text-center'>
                <h1 className='mb-4 text-4xl font-bold'>
                    Word Association Unlimited
                    {isPracticeMode && (
                        <span className='text-blue-400'> - Practice Mode</span>
                    )}
                </h1>
                <p className='text-sm text-zinc-400'>
                    {isPracticeMode
                        ? 'Practice with random sentences from past days'
                        : 'Shout out to my discord friends'}
                </p>
            </div>

            <div className='z-10 mb-2 space-y-2'>
                {currentWordSequence.map((word, rowIndex) => (
                    <div
                        key={rowIndex}
                        className={`flex items-center space-x-1.5 ${
                            isShaking && rowIndex === currentWordIndex + 1
                                ? 'shake'
                                : ''
                        }`}
                    >
                        {word
                            .toUpperCase()
                            .split('')
                            .map((letter, letterIndex) => {
                                if (rowIndex <= currentWordIndex) {
                                    return (
                                        <RevealedLetterTile
                                            key={letterIndex}
                                            letter={letter}
                                        />
                                    )
                                } else if (rowIndex === currentWordIndex + 1) {
                                    if (letterIndex === 0) {
                                        return (
                                            <FirstLetterTile
                                                key={letterIndex}
                                                letter={letter}
                                            />
                                        )
                                    } else {
                                        return (
                                            <InputTile
                                                key={`input-${letterIndex - 1}`}
                                                id={`input-${letterIndex - 1}`}
                                                value={
                                                    userInput[
                                                        letterIndex - 1
                                                    ] || ''
                                                }
                                                onChange={() => {
                                                    /* onChange is now handled globally */
                                                }}
                                            />
                                        )
                                    }
                                } else {
                                    if (letterIndex === 0) {
                                        return (
                                            <FirstLetterTile
                                                key={letterIndex}
                                                letter={letter}
                                            />
                                        )
                                    } else {
                                        return (
                                            <PlaceholderTile
                                                key={letterIndex}
                                            />
                                        )
                                    }
                                }
                            })}
                    </div>
                ))}
            </div>

            <VirtualKeyboard
                onKeyPress={handleVirtualKeyPress}
                onEnterPress={handleVirtualEnterPress}
                onBackspacePress={handleVirtualBackspacePress}
            />

            {isPracticeMode && (
                <div className='z-10 mt-6 flex flex-col items-center gap-3'>
                    <div className='flex gap-3'>
                        <button
                            onClick={() => {
                                initializeGame()
                            }}
                            className='rounded bg-blue-600 px-6 py-3 text-lg font-semibold text-white hover:bg-blue-500 focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-zinc-900 focus:outline-none'
                        >
                            New Practice
                        </button>
                        <button
                            onClick={() => {
                                setIsPracticeMode(false)
                                initializeGame()
                            }}
                            className='rounded bg-zinc-600 px-6 py-3 text-lg font-semibold text-white hover:bg-zinc-500 focus:ring-2 focus:ring-zinc-400 focus:ring-offset-2 focus:ring-offset-zinc-900 focus:outline-none'
                        >
                            Back to Daily
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
