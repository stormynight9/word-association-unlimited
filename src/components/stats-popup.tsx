import { useEffect, useState } from 'react'

interface StatsPopupProps {
    isOpen: boolean
    onClose: () => void
    attemptsPerWord: number[]
    totalAttempts: number
    currentWordSequence: string[]
    onPracticeMode: () => void
}

const StatsPopup = ({
    isOpen,
    onClose,
    attemptsPerWord,
    totalAttempts,
    currentWordSequence,
    onPracticeMode,
}: StatsPopupProps) => {
    const [timeUntilNext, setTimeUntilNext] = useState('')

    useEffect(() => {
        if (!isOpen) return

        const updateCountdown = () => {
            const now = new Date()
            const tomorrow = new Date(now)
            tomorrow.setDate(tomorrow.getDate() + 1)
            tomorrow.setHours(0, 0, 0, 0)

            const diff = tomorrow.getTime() - now.getTime()
            const hours = Math.floor(diff / (1000 * 60 * 60))
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
            const seconds = Math.floor((diff % (1000 * 60)) / 1000)

            setTimeUntilNext(
                `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
            )
        }

        updateCountdown()
        const interval = setInterval(updateCountdown, 1000)

        return () => clearInterval(interval)
    }, [isOpen])

    if (!isOpen) return null

    return (
        <div className='animate-in fade-in fixed inset-0 z-50 flex items-center justify-center duration-300'>
            <div
                className='absolute inset-0 bg-black opacity-60'
                onClick={onClose}
            ></div>
            <div className='animate-in zoom-in-95 fade-in relative mx-4 w-full max-w-md rounded-lg bg-zinc-800 p-6 text-white shadow-xl duration-300'>
                <button
                    onClick={onClose}
                    className='absolute top-5 right-7 text-zinc-400 hover:text-white'
                >
                    ✕
                </button>

                <h2 className='mb-6 text-center text-2xl font-bold'>
                    Statistics
                </h2>

                <div className='mb-6 text-center'>
                    <p className='text-lg font-semibold text-green-400'>
                        You&apos;ve completed all words! Great job Jared! 🎉
                    </p>
                </div>

                <div className='mb-6 space-y-4'>
                    <div className='text-center'>
                        <div className='text-3xl font-bold text-green-400'>
                            {totalAttempts}
                        </div>
                        <div className='text-sm text-zinc-400'>
                            Total Attempts
                        </div>
                    </div>

                    <div className='space-y-2'>
                        <h3 className='text-zinc-300'>Attempts per word:</h3>
                        {attemptsPerWord.map((attempts, index) => {
                            if (attempts === 0) return null
                            return (
                                <div
                                    key={index}
                                    className='flex items-center justify-between'
                                >
                                    <span className='text-zinc-300'>
                                        Word {index + 2}:{' '}
                                        <span className='font-bold text-white'>
                                            {currentWordSequence[index + 1]}
                                        </span>
                                    </span>
                                    <span className='font-semibold text-green-400'>
                                        {attempts}{' '}
                                        {attempts === 1
                                            ? 'attempt'
                                            : 'attempts'}
                                    </span>
                                </div>
                            )
                        })}
                    </div>
                </div>

                <div className='border-t border-zinc-600 pt-4'>
                    <div className='text-center'>
                        <div className='mb-2 text-lg font-semibold'>
                            Next Daily Challenge
                        </div>
                        <div className='font-mono text-2xl text-green-400'>
                            {timeUntilNext}
                        </div>
                    </div>
                </div>

                <div className='mt-6 flex gap-3'>
                    <button
                        onClick={onPracticeMode}
                        className='flex-1 rounded bg-blue-600 px-4 py-2 font-semibold text-white transition-colors hover:bg-blue-500'
                    >
                        Practice Mode
                    </button>
                    <button
                        onClick={onClose}
                        className='flex-1 rounded bg-green-600 px-4 py-2 font-semibold text-white transition-colors hover:bg-green-500'
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    )
}

export default StatsPopup
