'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Send, Mic, StopCircle } from 'lucide-react'
import { Progress } from "@/components/ui/progress"
import axios from 'axios'


interface Message {
  text: string
  sender: 'user' | 'bot'
}

export default function Chatbot() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [audioLevel, setAudioLevel] = useState(0)
  const [recordingDuration, setRecordingDuration] = useState(0)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const recognitionRef = useRef<any>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const microphoneStreamRef = useRef<MediaStream | null>(null)
  const recordingStartTimeRef = useRef<number | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const recordingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
    }
  }, [messages])
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition()
      recognitionRef.current.continuous = true
      recognitionRef.current.interimResults = true

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognitionRef.current.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0].transcript)
          .join('')
        setInput(transcript)
      }

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error', event.error)
        stopRecording()
      }

      recognitionRef.current.onend = () => {
        if (isRecording) {
          recognitionRef.current.start()
        }
      }
    } else {
      console.warn('Speech recognition not supported in this browser')
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
    }
  }, [isRecording])

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return

    const userMessage: Message = { text: input, sender: 'user' }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const response = await axios.post('http://localhost:8000/chat', {
        message: input,
      })

      if (response.status !== 200) {
        throw new Error('Failed to get response from chatbot')
      }

      const data = response.data
      const botMessage: Message = { text: data.message, sender: 'bot' }
      setMessages(prev => [...prev, botMessage])
    } catch (error) {
      console.error('Error:', error)
      const errorMessage: Message = { text: 'Sorry, I encountered an error. Please try again.', sender: 'bot' }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }



  const startRecording = useCallback(async () => {
    if (!recognitionRef.current) {
      console.warn('Speech recognition not supported')
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      microphoneStreamRef.current = stream

      audioContextRef.current = new (window.AudioContext || window.AudioContext)()
      analyserRef.current = audioContextRef.current.createAnalyser()
      const source = audioContextRef.current.createMediaStreamSource(stream)
      source.connect(analyserRef.current)

      recognitionRef.current.start()
      setIsRecording(true)
      recordingStartTimeRef.current = Date.now()

      const updateAudioLevelAndDuration = () => {
        if (analyserRef.current) {
          const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount)
          analyserRef.current.getByteFrequencyData(dataArray)
          const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length
          setAudioLevel(average / 255)
        }
        if (recordingStartTimeRef.current) {
          setRecordingDuration((Date.now() - recordingStartTimeRef.current) / 1000)
        }
        animationFrameRef.current = requestAnimationFrame(updateAudioLevelAndDuration)
      }
      updateAudioLevelAndDuration()

      recordingTimeoutRef.current = setTimeout(() => {
        stopRecording()
      }, 60000)
    } catch (error) {
      console.error('Error accessing microphone', error)
      stopRecording()
    }
  }, [])

  const stopRecording = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
    }
    if (microphoneStreamRef.current) {
      microphoneStreamRef.current.getTracks().forEach(track => track.stop())
    }
    if (audioContextRef.current) {
      audioContextRef.current.close()
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
    }
    if (recordingTimeoutRef.current) {
      clearTimeout(recordingTimeoutRef.current)
    }
    setIsRecording(false)
    setAudioLevel(0)
    setRecordingDuration(0)
    recordingStartTimeRef.current = null
  }, [])

  const toggleRecording = useCallback(() => {
    if (isRecording) {
      stopRecording()
    } else {
      startRecording()
    }
  }, [isRecording, startRecording, stopRecording])

  const formatDuration = (duration: number) => {
    const minutes = Math.floor(duration / 60)
    const seconds = Math.floor(duration % 60)
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }

  return (
    <div className="flex flex-col h-[600px] max-w-md mx-auto border rounded-lg overflow-hidden">
      <div className="bg-primary text-primary-foreground p-4">
        <h2 className="text-xl font-bold">Chatbot</h2>
      </div>
      <ScrollArea className="flex-grow p-4" ref={scrollAreaRef}>
        {messages.map((message, index) => (
          <div
            key={index}
            className={`mb-4 ${
              message.sender === 'user' ? 'text-right' : 'text-left'
            }`}
          >
            <span
              className={`inline-block p-2 rounded-lg ${
                message.sender === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-secondary-foreground'
              }`}
            >
              {message.text}
            </span>
          </div>
        ))}
        {isLoading && (
          <div className="text-left">
            <span className="inline-block p-2 rounded-lg bg-secondary text-secondary-foreground">
              Thinking...
            </span>
          </div>
        )}
      </ScrollArea>
      <form onSubmit={sendMessage} className="p-4 border-t">
        {isRecording ? (
          <div className="flex items-center space-x-2 mb-2">
            <div className="relative flex-grow">
              <Progress value={recordingDuration} max={60} className="h-2" />
              <div 
                className="absolute top-0 left-0 h-full bg-red-500 opacity-50"
                style={{ width: `${audioLevel * 100}%` }}
              ></div>
            </div>
            <span className="text-sm font-medium">{formatDuration(recordingDuration)}</span>
            <Button 
              type="button" 
              variant="destructive" 
              size="icon"
              onClick={stopRecording}
              aria-label="Stop recording"
            >
              <StopCircle className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="flex space-x-2 mb-2">
            <Input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              className="flex-grow"
            />
            <Button 
              type="button" 
              variant="outline" 
              size="icon" 
              onClick={toggleRecording}
              aria-label="Start recording"
            >
              <Mic className="h-4 w-4" />
            </Button>
            <Button type="submit" disabled={isLoading} aria-label="Send message">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        )}
      </form>
    </div>
  )
}