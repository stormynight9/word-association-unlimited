'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
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

// Save game state to localStorage
function saveGameState(state: {
    currentWordSequence: string[]
    currentWordIndex: number
    userInput: string[]
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
    date: string
} | null {
    try {
        const saved = localStorage.getItem('wordAssociationGame')
        if (saved) {
            return JSON.parse(saved)
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
    const [feedback, setFeedback] = useState('')
    const [isShaking, setIsShaking] = useState(false)
    const [showConfetti, setShowConfetti] = useState(false)

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

        if (guessedWord === wordToGuess.toUpperCase()) {
            const newCurrentWordIndex = currentWordIndex + 1
            setCurrentWordIndex(newCurrentWordIndex)
            setFeedback('')
            if (newCurrentWordIndex < currentWordSequence.length - 1) {
                const nextWordToSetUp =
                    currentWordSequence[newCurrentWordIndex + 1]
                const newUserInput = Array(
                    nextWordToSetUp.length > 0 ? nextWordToSetUp.length - 1 : 0
                ).fill('')
                setUserInput(newUserInput)

                // Save progress to localStorage
                saveGameState({
                    currentWordSequence,
                    currentWordIndex: newCurrentWordIndex,
                    userInput: newUserInput,
                    date: getTodayDateString(),
                })

                setTimeout(() => document.getElementById('input-0')?.focus(), 0)
            } else {
                setUserInput([])
                setFeedback("You've completed all words! Great job Jared! 🎉")
                setShowConfetti(true)
                setTimeout(() => setShowConfetti(false), 4000)

                // Save completed state
                saveGameState({
                    currentWordSequence,
                    currentWordIndex: newCurrentWordIndex,
                    userInput: [],
                    date: getTodayDateString(),
                })
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
    }, [currentWordIndex, currentWordSequence, userInput])

    const initializeGame = useCallback(() => {
        const todayDate = getTodayDateString()
        const savedState = loadGameState()

        // Check if we have a saved state for today's date
        if (savedState && savedState.date === todayDate) {
            // Restore saved state
            setCurrentWordSequence(savedState.currentWordSequence)
            setCurrentWordIndex(savedState.currentWordIndex)
            setUserInput(savedState.userInput)
            const isCompleted =
                savedState.currentWordIndex >=
                savedState.currentWordSequence.length - 1
            setFeedback(
                isCompleted
                    ? "You've completed all words! Great job Jared! 🎉"
                    : ''
            )
            setIsShaking(false)

            // Show confetti if game was already completed
            if (isCompleted) {
                setShowConfetti(true)
                setTimeout(() => setShowConfetti(false), 4000)
            } else {
                setShowConfetti(false)
            }
        } else {
            // Start fresh game for today
            const newSequence = getDailySequence()
            setCurrentWordSequence(newSequence)
            setCurrentWordIndex(0)
            setFeedback('')
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
                    date: todayDate,
                })
            } else {
                setUserInput([])
            }
        }
        setTimeout(() => document.getElementById('input-0')?.focus(), 0)
    }, [])

    useEffect(() => {
        initializeGame()
    }, [initializeGame])

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

    return (
        <div className='relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-zinc-900 p-4 text-white'>
            {showConfetti && <ConfettiEffect />}
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
                </h1>
                <p className='text-sm text-zinc-400'>
                    Shout out to my discord friends
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

            {feedback && (
                <p
                    className={`z-10 mb-4 text-xl ${feedback.includes('completed') ? 'text-green-600' : 'text-red-400'}`}
                >
                    {feedback}
                </p>
            )}

            <VirtualKeyboard
                onKeyPress={handleVirtualKeyPress}
                onEnterPress={handleVirtualEnterPress}
                onBackspacePress={handleVirtualBackspacePress}
            />

            {currentWordIndex >= currentWordSequence.length - 1 &&
                currentWordSequence.length > 0 && (
                    <button
                        onClick={initializeGame}
                        className='z-10 mt-8 rounded bg-green-500 px-8 py-3 text-lg font-semibold text-white hover:bg-green-400 focus:ring-2 focus:ring-green-400 focus:ring-offset-2 focus:ring-offset-zinc-900 focus:outline-none'
                    >
                        Play Again
                    </button>
                )}
        </div>
    )
}
