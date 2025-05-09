'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { WORDLIST } from '../constants'

// Helper function to pick a random item from an array
function getRandomItem<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)]
}

const RevealedLetterTile = ({ letter }: { letter: string }) => (
    <div className='flex h-14 w-14 items-center justify-center rounded bg-green-600 text-3xl font-bold text-white sm:h-16 sm:w-16'>
        {letter}
    </div>
)

const HintLetterTile = ({
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
    const [currentWordIndex, setCurrentWordIndex] = useState(0) // Index of the last fully known word
    const [userInput, setUserInput] = useState<string[]>([]) // For letters AFTER the hint
    const [feedback, setFeedback] = useState('')
    const [isErrorFlash, setIsErrorFlash] = useState(false)
    const [showConfetti, setShowConfetti] = useState(false)
    const [revealedByHintIndices, setRevealedByHintIndices] = useState<
        Set<number>
    >(new Set())

    const handleInputChange = useCallback(
        (index: number, value: string) => {
            // Check if the index is valid for the current userInput array and value is a single letter
            if (
                /^[a-zA-Z]$/.test(value) &&
                index >= 0 &&
                index < userInput.length
            ) {
                const newUserInput = [...userInput]
                newUserInput[index] = value.toUpperCase()
                setUserInput(newUserInput)

                // If a letter was placed and it's not the last input field
                if (index < userInput.length - 1) {
                    setTimeout(
                        () =>
                            document
                                .getElementById(`input-${index + 1}`)
                                ?.focus(),
                        0
                    )
                } else if (index === userInput.length - 1) {
                    // If it was the last input, focus it (important for subsequent Enter press)
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
            setRevealedByHintIndices(new Set())
            if (newCurrentWordIndex < currentWordSequence.length - 1) {
                const nextWordToSetUp =
                    currentWordSequence[newCurrentWordIndex + 1]
                setUserInput(
                    Array(
                        nextWordToSetUp.length > 0
                            ? nextWordToSetUp.length - 1
                            : 0
                    ).fill('')
                )
                setTimeout(() => document.getElementById('input-0')?.focus(), 0)
            } else {
                setUserInput([])
                setFeedback("You've completed all words! Great job Jared! 🎉")
                setShowConfetti(true)
                setTimeout(() => setShowConfetti(false), 4000)
            }
        } else {
            setIsErrorFlash(true)
            setTimeout(() => setIsErrorFlash(false), 500)
            setUserInput((prevInput) =>
                prevInput.map(
                    (char, index) =>
                        revealedByHintIndices.has(index) ? char : '' // Keep hinted letters, clear others
                )
            )
            setTimeout(() => document.getElementById('input-0')?.focus(), 0)
        }
    }, [
        currentWordIndex,
        currentWordSequence,
        userInput,
        revealedByHintIndices,
    ])

    const initializeGame = useCallback(() => {
        const newSequence = getRandomItem(WORDLIST)
        setCurrentWordSequence(newSequence)
        setCurrentWordIndex(0)
        setFeedback('')
        setIsErrorFlash(false)
        setShowConfetti(false)
        setRevealedByHintIndices(new Set())
        if (newSequence.length > 1 && newSequence[1]) {
            setUserInput(
                Array(
                    newSequence[1].length > 0 ? newSequence[1].length - 1 : 0
                ).fill('')
            )
        } else {
            setUserInput([])
        }
        setTimeout(() => document.getElementById('input-0')?.focus(), 0)
    }, [])

    useEffect(() => {
        initializeGame()
    }, [initializeGame])

    const handleRequestHint = useCallback(() => {
        const wordToGuessString = currentWordSequence[currentWordIndex + 1]
        if (!wordToGuessString) return

        let hintGiven = false
        let hintedInputIndex = -1 // To store the index of the input that got the hint
        const newUserInput = [...userInput]

        // Always find the first available empty slot from left-to-right that hasn't been hinted yet.
        for (let i = 0; i < userInput.length; i++) {
            if (userInput[i] === '' && !revealedByHintIndices.has(i)) {
                const correctLetter = wordToGuessString[i + 1]?.toUpperCase() // +1 because wordToGuessString includes the leading visible hint
                if (correctLetter) {
                    newUserInput[i] = correctLetter
                    setRevealedByHintIndices((prev) => new Set(prev).add(i))
                    hintGiven = true
                    hintedInputIndex = i
                    break // Reveal only one letter per click
                }
            }
        }

        if (hintGiven) {
            setUserInput(newUserInput)
            // Focus logic after a hint is successfully given:
            // Try to focus the next available empty slot that is not hinted.
            // If none, focus the slot that was just hinted (if it's the last one to fill).
            let nextFocusIndex = -1
            for (let i = 0; i < newUserInput.length; i++) {
                if (newUserInput[i] === '' && !revealedByHintIndices.has(i)) {
                    nextFocusIndex = i
                    break
                }
            }

            if (nextFocusIndex !== -1) {
                setTimeout(
                    () =>
                        document
                            .getElementById(`input-${nextFocusIndex}`)
                            ?.focus(),
                    0
                )
            } else if (hintedInputIndex !== -1) {
                // If no other empty un-hinted slot, focus the one just hinted (especially if it completes the word visually)
                setTimeout(
                    () =>
                        document
                            .getElementById(`input-${hintedInputIndex}`)
                            ?.focus(),
                    0
                )
            }
        }
    }, [
        currentWordSequence,
        currentWordIndex,
        userInput,
        revealedByHintIndices,
    ])

    // Handlers for Virtual Keyboard
    const handleVirtualKeyPress = useCallback(
        (key: string) => {
            const firstEmptyIndex = userInput.findIndex(
                (char) =>
                    char === '' &&
                    !revealedByHintIndices.has(userInput.indexOf(char))
            )
            const firstTrulyEmptyIndex = userInput.findIndex(
                (char) => char === ''
            )
            if (firstTrulyEmptyIndex !== -1) {
                handleInputChange(firstTrulyEmptyIndex, key)
            }
        },
        [userInput, handleInputChange, revealedByHintIndices]
    )

    const handleVirtualBackspacePress = useCallback(() => {
        setUserInput((prevUserInput) => {
            const newUserInput = [...prevUserInput]
            let lastFilledIndex = -1
            for (let i = newUserInput.length - 1; i >= 0; i--) {
                if (newUserInput[i] !== '' && !revealedByHintIndices.has(i)) {
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
            return prevUserInput // No change if no character to delete
        })
    }, [revealedByHintIndices])

    const handleVirtualEnterPress = useCallback(() => {
        handleSubmit()
    }, [handleSubmit])

    // Global keydown listener for physical keyboard
    useEffect(() => {
        const handleGlobalKeyDown = (event: KeyboardEvent) => {
            if (showConfetti) return // Don't process game input if confetti is showing

            // Check if the event target is an input, button, or textarea to avoid interfering with other controls if any were added
            const targetNodeName = (event.target as HTMLElement)?.nodeName
            if (
                targetNodeName === 'INPUT' ||
                targetNodeName === 'BUTTON' ||
                targetNodeName === 'TEXTAREA'
            ) {
                // If focus is on an actual input or button, let its own handlers (if any) or default behavior work primarily
                // Our inputs are readOnly, so this check is more for future-proofing or if other interactive elements are added.
                // For this game, specifically, we want global keys to work even if input is focused, so we might refine this.
                // For now, let's assume readOnly inputs don't need this check to be too strict.
            }

            const key = event.key.toUpperCase()

            if (key.length === 1 && key >= 'A' && key <= 'Z') {
                event.preventDefault()
                // Prevent typing if all inputs are full or if the next available slot is a hint that shouldn't be overwritten
                const firstEmptyIdx = userInput.findIndex((char) => char === '')
                if (
                    firstEmptyIdx !== -1 &&
                    !revealedByHintIndices.has(firstEmptyIdx)
                ) {
                    handleVirtualKeyPress(key)
                } else if (firstEmptyIdx === -1 && userInput.includes('')) {
                    // This case means there are empty slots but they might be hinted, let's re-check logic for handleVirtualKeyPress
                    // For now, let physical keyboard call the same virtual key press.
                    handleVirtualKeyPress(key)
                }
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
        userInput,
        revealedByHintIndices,
    ])

    if (currentWordSequence.length === 0) {
        return <div>Loading game...</div>
    }

    // Determine if hint button should be disabled
    let hintButtonDisabled = true
    const activeWordToGuess = currentWordSequence[currentWordIndex + 1]
    if (activeWordToGuess) {
        if (
            userInput.some(
                (char, index) =>
                    char === '' && !revealedByHintIndices.has(index)
            )
        ) {
            hintButtonDisabled = false
        }
    }
    if (!activeWordToGuess) hintButtonDisabled = true // Also disable if no active word

    return (
        <div className='relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-zinc-900 p-4 text-white'>
            {showConfetti && <ConfettiEffect />}
            <div className='mb-4 text-center'>
                <h1 className='mb-4 text-4xl font-bold'>
                    Word Association Unlimited
                </h1>
                <p className='text-sm text-zinc-400'>
                    Shout out to my discord friends
                </p>
            </div>

            <div className='z-10 mb-4 space-y-2'>
                {currentWordSequence.map((word, rowIndex) => (
                    <div
                        key={rowIndex}
                        className='flex items-center space-x-1.5'
                    >
                        {word
                            .toUpperCase()
                            .split('')
                            .map((letter, letterIndex) => {
                                if (rowIndex <= currentWordIndex) {
                                    // Fully revealed word
                                    return (
                                        <RevealedLetterTile
                                            key={letterIndex}
                                            letter={letter}
                                        />
                                    )
                                } else if (rowIndex === currentWordIndex + 1) {
                                    // Active word for guessing
                                    const showError = isErrorFlash
                                    if (letterIndex === 0) {
                                        return (
                                            <HintLetterTile
                                                key={letterIndex}
                                                letter={letter}
                                                className={
                                                    showError
                                                        ? 'border-2 !border-red-500/60'
                                                        : ''
                                                }
                                            />
                                        )
                                    } else {
                                        // userInput is for letters *after* the hint
                                        return (
                                            <InputTile
                                                key={`input-${letterIndex - 1}`}
                                                id={`input-${letterIndex - 1}`}
                                                value={
                                                    userInput[
                                                        letterIndex - 1
                                                    ] || ''
                                                }
                                                onChange={(e) =>
                                                    handleInputChange(
                                                        letterIndex - 1,
                                                        e.target.value
                                                    )
                                                }
                                                className={
                                                    showError
                                                        ? 'border-2 !border-red-500/60'
                                                        : ''
                                                }
                                            />
                                        )
                                    }
                                } else {
                                    // Future words (show hint and placeholders)
                                    if (letterIndex === 0) {
                                        return (
                                            <HintLetterTile
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

            <button
                onClick={handleRequestHint}
                disabled={hintButtonDisabled}
                className='z-10 mb-4 rounded bg-zinc-500 px-6 py-2 text-base font-medium text-white hover:bg-zinc-400 focus:ring-2 focus:ring-zinc-400 focus:ring-offset-2 focus:ring-offset-zinc-900 focus:outline-none disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:text-zinc-500'
            >
                Hint
            </button>

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
