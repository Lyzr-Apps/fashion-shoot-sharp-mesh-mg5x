'use client'

import React, { useState, useCallback, useRef, useEffect } from 'react'
import { callAIAgent, uploadFiles } from '@/lib/aiAgent'
import { FiUpload, FiDownload, FiImage, FiGrid, FiPlus, FiStar, FiX, FiChevronDown, FiSearch, FiFilter, FiRefreshCw, FiTrash2, FiCalendar, FiUser, FiCamera, FiLayers, FiHeart, FiCheck, FiArrowLeft, FiArrowRight, FiZoomIn, FiMaximize2, FiClock } from 'react-icons/fi'
import { HiOutlineSparkles } from 'react-icons/hi2'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'

// --- Constants ---

const AGENT_ID = '698f36250f0fd5392ca89bf4'

const AI_MODELS = [
  { id: 'model-1', name: 'Aria Chen', gender: 'Female', ethnicity: 'East Asian', ageRange: 'Young Adult', description: 'Elegant pose, straight black hair, warm skin tone' },
  { id: 'model-2', name: 'Marcus Johnson', gender: 'Male', ethnicity: 'African American', ageRange: 'Adult', description: 'Athletic build, confident stance, short cropped hair' },
  { id: 'model-3', name: 'Sofia Rodriguez', gender: 'Female', ethnicity: 'Hispanic/Latina', ageRange: 'Young Adult', description: 'Curvy figure, long wavy brown hair, radiant smile' },
  { id: 'model-4', name: 'James Mitchell', gender: 'Male', ethnicity: 'Caucasian', ageRange: 'Adult', description: 'Tall, lean build, sandy blonde hair, clean-shaven' },
  { id: 'model-5', name: 'Priya Sharma', gender: 'Female', ethnicity: 'South Asian', ageRange: 'Young Adult', description: 'Graceful posture, long dark hair, warm brown eyes' },
  { id: 'model-6', name: 'Kwame Asante', gender: 'Male', ethnicity: 'West African', ageRange: 'Young Adult', description: 'Muscular build, dark skin, bright white smile' },
  { id: 'model-7', name: 'Emma Larsson', gender: 'Female', ethnicity: 'Scandinavian', ageRange: 'Adult', description: 'Tall, slim build, platinum blonde hair, blue eyes' },
  { id: 'model-8', name: 'Yuki Tanaka', gender: 'Non-binary', ethnicity: 'Japanese', ageRange: 'Young Adult', description: 'Androgynous look, styled short hair, minimalist aesthetic' },
  { id: 'model-9', name: 'Diego Morales', gender: 'Male', ethnicity: 'Mexican', ageRange: 'Mature', description: 'Distinguished look, salt-and-pepper hair, warm complexion' },
  { id: 'model-10', name: 'Amara Okafor', gender: 'Female', ethnicity: 'Nigerian', ageRange: 'Adult', description: 'Statuesque figure, rich dark skin, braided hair' },
  { id: 'model-11', name: 'Liam O\'Brien', gender: 'Male', ethnicity: 'Irish', ageRange: 'Young Adult', description: 'Athletic build, red hair, freckled fair skin' },
  { id: 'model-12', name: 'Mei Lin', gender: 'Female', ethnicity: 'Chinese', ageRange: 'Adult', description: 'Petite frame, elegant bone structure, straight dark hair' },
]

const CATEGORIES = ['Upper Body', 'Lower Body', 'Footwear', 'Accessories', 'Full Outfit']

const GENDER_OPTIONS = ['Female', 'Male', 'Non-binary']
const ETHNICITY_OPTIONS = ['East Asian', 'African American', 'Hispanic/Latina', 'Caucasian', 'South Asian', 'West African', 'Scandinavian', 'Japanese', 'Mexican', 'Nigerian', 'Irish', 'Chinese']
const AGE_OPTIONS = ['Young Adult', 'Adult', 'Mature']

// --- Types ---

interface AIModelType {
  id: string
  name: string
  gender: string
  ethnicity: string
  ageRange: string
  description: string
}

interface GenerationRecord {
  id: string
  productName: string
  category: string
  modelName: string
  imageUrl: string
  productPreviewUrl: string
  response: {
    image_description: string
    product_details: string
    model_details: string
    styling_notes: string
  }
  date: string
}

interface StatusMessage {
  type: 'success' | 'error' | 'info'
  text: string
}

// --- Helpers ---

function renderMarkdown(text: string) {
  if (!text) return null
  return (
    <div className="space-y-2">
      {text.split('\n').map((line, i) => {
        if (line.startsWith('### '))
          return <h4 key={i} className="font-medium text-sm mt-3 mb-1">{line.slice(4)}</h4>
        if (line.startsWith('## '))
          return <h3 key={i} className="font-medium text-base mt-3 mb-1">{line.slice(3)}</h3>
        if (line.startsWith('# '))
          return <h2 key={i} className="font-medium text-lg mt-4 mb-2">{line.slice(2)}</h2>
        if (line.startsWith('- ') || line.startsWith('* '))
          return <li key={i} className="ml-4 list-disc text-sm leading-relaxed">{formatInline(line.slice(2))}</li>
        if (/^\d+\.\s/.test(line))
          return <li key={i} className="ml-4 list-decimal text-sm leading-relaxed">{formatInline(line.replace(/^\d+\.\s/, ''))}</li>
        if (!line.trim()) return <div key={i} className="h-1" />
        return <p key={i} className="text-sm leading-relaxed">{formatInline(line)}</p>
      })}
    </div>
  )
}

function formatInline(text: string) {
  const parts = text.split(/\*\*(.*?)\*\*/g)
  if (parts.length === 1) return text
  return parts.map((part, i) =>
    i % 2 === 1 ? <strong key={i} className="font-medium">{part}</strong> : part
  )
}

function generateId() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}

// --- Model Avatar Colors (unique per model for visual distinction) ---

const MODEL_GRADIENTS: Record<string, { from: string; to: string; accent: string }> = {
  'model-1':  { from: '#f8e8d0', to: '#e8c9a0', accent: '#c9a06a' },
  'model-2':  { from: '#d4e4f7', to: '#a8c4e0', accent: '#6a8fb5' },
  'model-3':  { from: '#fce4e4', to: '#f0b8b8', accent: '#d47070' },
  'model-4':  { from: '#e0eed8', to: '#b8d4a8', accent: '#7aaa5c' },
  'model-5':  { from: '#f5e6d0', to: '#e0c4a0', accent: '#c49a60' },
  'model-6':  { from: '#dde8f0', to: '#b0c8dc', accent: '#6a94b4' },
  'model-7':  { from: '#f0e8f4', to: '#d4c0e0', accent: '#a080b8' },
  'model-8':  { from: '#e4eae0', to: '#c0d0b8', accent: '#8aaa74' },
  'model-9':  { from: '#f4e0d0', to: '#e0bca0', accent: '#c0946a' },
  'model-10': { from: '#e8dce0', to: '#d0b8c0', accent: '#a88090' },
  'model-11': { from: '#e0e8e4', to: '#b4ccc0', accent: '#70a090' },
  'model-12': { from: '#f0ece0', to: '#dcd4c0', accent: '#b8aa88' },
}

function ModelAvatar({ model, size = 'md' }: { model: AIModelType; size?: 'sm' | 'md' | 'lg' }) {
  const gradient = MODEL_GRADIENTS[model.id] || { from: '#e8e0d8', to: '#d0c4b8', accent: '#a09080' }
  const initials = model.name.split(' ').map(n => n[0]).join('').toUpperCase()

  const sizeClasses = {
    sm: 'w-full aspect-[3/4]',
    md: 'w-full aspect-[3/4]',
    lg: 'w-full aspect-[3/4]',
  }

  const iconSizes = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-20 h-20',
  }

  const initialSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-xl',
  }

  const silhouetteSizes = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-36 h-36',
  }

  return (
    <div
      className={`${sizeClasses[size]} relative overflow-hidden flex flex-col items-center justify-center`}
      style={{ background: `linear-gradient(160deg, ${gradient.from} 0%, ${gradient.to} 100%)` }}
    >
      {/* Silhouette shape */}
      <div
        className={`${silhouetteSizes[size]} rounded-full opacity-[0.18] absolute`}
        style={{
          background: `radial-gradient(circle at 50% 35%, ${gradient.accent} 0%, transparent 70%)`,
          top: '15%',
        }}
      />
      {/* Head circle */}
      <div
        className={`${iconSizes[size]} rounded-full flex items-center justify-center mb-1 relative z-10`}
        style={{ backgroundColor: gradient.accent + '30', border: `2px solid ${gradient.accent}50` }}
      >
        <FiUser className={`${size === 'sm' ? 'w-4 h-4' : size === 'md' ? 'w-5 h-5' : 'w-8 h-8'}`} style={{ color: gradient.accent }} />
      </div>
      {/* Initials badge */}
      <div
        className={`${initialSizes[size]} font-serif tracking-[0.15em] font-normal relative z-10 mt-1`}
        style={{ color: gradient.accent }}
      >
        {initials}
      </div>
      {/* Gender indicator dot */}
      <div className="absolute top-2 left-2 flex items-center gap-1">
        <div
          className="w-1.5 h-1.5 rounded-full"
          style={{ backgroundColor: gradient.accent }}
        />
      </div>
      {/* Decorative corner accent */}
      <div
        className="absolute bottom-0 right-0 w-8 h-8 opacity-20"
        style={{
          background: `linear-gradient(135deg, transparent 50%, ${gradient.accent} 50%)`,
        }}
      />
    </div>
  )
}

// --- Sub-components ---

function Sidebar({ activeScreen, onNavigate }: { activeScreen: string; onNavigate: (screen: string) => void }) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: FiGrid },
    { id: 'new-photoshoot', label: 'New Photoshoot', icon: FiCamera },
    { id: 'model-gallery', label: 'Model Gallery', icon: FiUser },
    { id: 'my-generations', label: 'My Generations', icon: FiImage },
  ]

  return (
    <div className="fixed left-0 top-0 bottom-0 w-60 bg-card border-r border-border flex flex-col z-40">
      <div className="px-6 py-8">
        <h1 className="font-serif text-lg font-light tracking-[0.2em] text-foreground">FASHIONSHOOT</h1>
        <p className="text-xs text-muted-foreground tracking-wider mt-1 font-light">AI PHOTOGRAPHY</p>
      </div>
      <Separator />
      <nav className="flex-1 px-3 py-6 space-y-1">
        {navItems.map((item) => {
          const isActive = activeScreen === item.id
          const Icon = item.icon
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm tracking-wider font-light transition-all duration-200 ${isActive ? 'border-l-2 border-primary text-primary bg-secondary' : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50 border-l-2 border-transparent'}`}
            >
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
            </button>
          )
        })}
      </nav>
      <Separator />
      <div className="px-6 py-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <HiOutlineSparkles className="w-3 h-3" />
          <span className="tracking-wider font-light">AI-POWERED</span>
        </div>
      </div>
    </div>
  )
}

function DashboardScreen({ generations, onNavigate }: { generations: GenerationRecord[]; onNavigate: (screen: string) => void }) {
  const thisMonth = generations.filter((g) => {
    const genDate = new Date(g.date)
    const now = new Date()
    return genDate.getMonth() === now.getMonth() && genDate.getFullYear() === now.getFullYear()
  })

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-serif text-2xl font-light tracking-wider text-foreground">Welcome back</h2>
        <p className="text-sm text-muted-foreground tracking-wider mt-2 font-light">Create stunning fashion photography with AI</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border border-border shadow-sm">
          <CardContent className="pt-6 pb-6">
            <p className="text-xs text-muted-foreground tracking-wider uppercase font-light">Total Generations</p>
            <p className="text-3xl font-light text-foreground mt-2">{generations.length}</p>
          </CardContent>
        </Card>
        <Card className="border border-border shadow-sm">
          <CardContent className="pt-6 pb-6">
            <p className="text-xs text-muted-foreground tracking-wider uppercase font-light">This Month</p>
            <p className="text-3xl font-light text-foreground mt-2">{thisMonth.length}</p>
          </CardContent>
        </Card>
        <Card className="border border-border shadow-sm">
          <CardContent className="pt-6 pb-6">
            <p className="text-xs text-muted-foreground tracking-wider uppercase font-light">AI Models Available</p>
            <p className="text-3xl font-light text-foreground mt-2">{AI_MODELS.length}</p>
          </CardContent>
        </Card>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-serif text-lg font-light tracking-wider">Recent Generations</h3>
          {generations.length > 0 && (
            <Button variant="ghost" size="sm" onClick={() => onNavigate('my-generations')} className="text-xs tracking-wider">
              View All <FiArrowRight className="ml-1 w-3 h-3" />
            </Button>
          )}
        </div>
        {generations.length === 0 ? (
          <Card className="border border-border shadow-sm">
            <CardContent className="py-12 text-center">
              <FiCamera className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground tracking-wider font-light">No generations yet</p>
              <p className="text-xs text-muted-foreground mt-1 font-light">Start your first photoshoot to see results here</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {generations.slice(0, 4).map((gen) => (
              <Card key={gen.id} className="border border-border shadow-sm overflow-hidden">
                <div className="aspect-[4/3] bg-muted relative">
                  {gen.imageUrl ? (
                    <img src={gen.imageUrl} alt={gen.productName} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <FiImage className="w-8 h-8 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <CardContent className="pt-4 pb-4">
                  <p className="text-sm font-light tracking-wider">{gen.productName}</p>
                  <div className="flex items-center justify-between mt-2">
                    <Badge variant="secondary" className="text-xs font-light tracking-wider">{gen.category}</Badge>
                    <span className="text-xs text-muted-foreground font-light">{gen.modelName}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Card className="border border-primary/30 shadow-sm bg-secondary/30">
        <CardContent className="py-8 text-center">
          <HiOutlineSparkles className="w-6 h-6 text-primary mx-auto mb-3" />
          <h3 className="font-serif text-lg font-light tracking-wider mb-2">Start a New Photoshoot</h3>
          <p className="text-sm text-muted-foreground tracking-wider font-light mb-4">Upload your product and select an AI model to generate professional fashion photography</p>
          <Button onClick={() => onNavigate('new-photoshoot')} className="bg-primary text-primary-foreground hover:bg-primary/90 tracking-wider text-sm font-light px-8">
            <FiPlus className="mr-2 w-4 h-4" /> New Photoshoot
          </Button>
        </CardContent>
      </Card>

      <Card className="border border-border shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-xs tracking-wider uppercase text-muted-foreground font-light">Agent Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <div>
              <p className="text-sm font-light tracking-wider">Photoshoot Generation Agent</p>
              <p className="text-xs text-muted-foreground font-light">Ready</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function NewPhotoshootScreen({
  productFile,
  productPreview,
  selectedCategory,
  selectedModel,
  additionalNotes,
  isGenerating,
  generationResult,
  statusMessage,
  onProductUpload,
  onRemoveProduct,
  onCategoryChange,
  onModelSelect,
  onNotesChange,
  onGenerate,
  onRegenerate,
  onTryDifferentModel,
  onSaveAndNew,
  onDownload,
}: {
  productFile: File | null
  productPreview: string | null
  selectedCategory: string
  selectedModel: AIModelType | null
  additionalNotes: string
  isGenerating: boolean
  generationResult: { imageUrl: string; response: { image_description: string; product_details: string; model_details: string; styling_notes: string } } | null
  statusMessage: StatusMessage | null
  onProductUpload: (file: File) => void
  onRemoveProduct: () => void
  onCategoryChange: (cat: string) => void
  onModelSelect: (model: AIModelType) => void
  onNotesChange: (notes: string) => void
  onGenerate: () => void
  onRegenerate: () => void
  onTryDifferentModel: () => void
  onSaveAndNew: () => void
  onDownload: () => void
}) {
  const [dragActive, setDragActive] = useState(false)
  const [genderFilter, setGenderFilter] = useState<string>('all')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    const files = e.dataTransfer.files
    if (files && files[0]) {
      const file = files[0]
      if (file.size <= 10 * 1024 * 1024 && (file.type === 'image/jpeg' || file.type === 'image/png' || file.type === 'image/webp')) {
        onProductUpload(file)
      }
    }
  }, [onProductUpload])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files[0]) {
      const file = files[0]
      if (file.size <= 10 * 1024 * 1024 && (file.type === 'image/jpeg' || file.type === 'image/png' || file.type === 'image/webp')) {
        onProductUpload(file)
      }
    }
  }, [onProductUpload])

  const filteredModels = AI_MODELS.filter((m) => {
    if (genderFilter !== 'all' && m.gender !== genderFilter) return false
    return true
  })

  const canGenerate = productFile && selectedModel && selectedCategory && !isGenerating

  if (generationResult) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-2xl font-light tracking-wider">Generation Complete</h2>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onDownload} className="tracking-wider text-xs font-light">
              <FiDownload className="mr-1 w-3 h-3" /> Download
            </Button>
            <Button variant="outline" size="sm" onClick={onTryDifferentModel} className="tracking-wider text-xs font-light">
              <FiUser className="mr-1 w-3 h-3" /> Try Different Model
            </Button>
            <Button variant="outline" size="sm" onClick={onRegenerate} className="tracking-wider text-xs font-light">
              <FiRefreshCw className="mr-1 w-3 h-3" /> Regenerate
            </Button>
            <Button size="sm" onClick={onSaveAndNew} className="bg-primary text-primary-foreground hover:bg-primary/90 tracking-wider text-xs font-light">
              <FiPlus className="mr-1 w-3 h-3" /> New Photoshoot
            </Button>
          </div>
        </div>

        {statusMessage && (
          <div className={`p-3 text-sm tracking-wider font-light ${statusMessage.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : statusMessage.type === 'error' ? 'bg-red-50 text-red-800 border border-red-200' : 'bg-blue-50 text-blue-800 border border-blue-200'}`}>
            {statusMessage.text}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border border-border shadow-sm overflow-hidden">
            <div className="aspect-[3/4] bg-muted relative">
              {generationResult.imageUrl ? (
                <img src={generationResult.imageUrl} alt="Generated photoshoot" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <FiImage className="w-12 h-12 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground ml-2">Image generated</p>
                </div>
              )}
            </div>
          </Card>

          <div className="space-y-4">
            {generationResult.response?.image_description && (
              <Card className="border border-border shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs tracking-wider uppercase text-muted-foreground font-light">Image Description</CardTitle>
                </CardHeader>
                <CardContent>
                  {renderMarkdown(generationResult.response.image_description)}
                </CardContent>
              </Card>
            )}
            {generationResult.response?.product_details && (
              <Card className="border border-border shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs tracking-wider uppercase text-muted-foreground font-light">Product Details</CardTitle>
                </CardHeader>
                <CardContent>
                  {renderMarkdown(generationResult.response.product_details)}
                </CardContent>
              </Card>
            )}
            {generationResult.response?.model_details && (
              <Card className="border border-border shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs tracking-wider uppercase text-muted-foreground font-light">Model Details</CardTitle>
                </CardHeader>
                <CardContent>
                  {renderMarkdown(generationResult.response.model_details)}
                </CardContent>
              </Card>
            )}
            {generationResult.response?.styling_notes && (
              <Card className="border border-border shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs tracking-wider uppercase text-muted-foreground font-light">Styling Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  {renderMarkdown(generationResult.response.styling_notes)}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif text-2xl font-light tracking-wider">New Photoshoot</h2>
        <p className="text-sm text-muted-foreground tracking-wider mt-1 font-light">Upload your product, select a model, and generate professional fashion photography</p>
      </div>

      {statusMessage && (
        <div className={`p-3 text-sm tracking-wider font-light ${statusMessage.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : statusMessage.type === 'error' ? 'bg-red-50 text-red-800 border border-red-200' : 'bg-blue-50 text-blue-800 border border-blue-200'}`}>
          {statusMessage.text}
        </div>
      )}

      {isGenerating && (
        <Card className="border border-primary/30 shadow-sm">
          <CardContent className="py-12 text-center">
            <FiRefreshCw className="w-8 h-8 text-primary mx-auto mb-4 animate-spin" />
            <p className="text-sm tracking-wider font-light text-foreground">Generating your photoshoot...</p>
            <p className="text-xs text-muted-foreground mt-2 font-light tracking-wider">This may take a moment while our AI creates your image</p>
            <div className="max-w-xs mx-auto mt-4">
              <Progress value={66} className="h-1" />
            </div>
          </CardContent>
        </Card>
      )}

      {!isGenerating && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel - Product Upload */}
          <Card className="border border-border shadow-sm">
            <CardHeader>
              <CardTitle className="text-sm tracking-wider uppercase font-light flex items-center gap-2">
                <FiUpload className="w-4 h-4" /> Product Upload
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!productPreview ? (
                <div
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed p-8 text-center cursor-pointer transition-all duration-200 ${dragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <FiUpload className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground tracking-wider font-light">Drag & drop your product image</p>
                  <p className="text-xs text-muted-foreground mt-1 font-light">or click to browse</p>
                  <p className="text-xs text-muted-foreground mt-3 font-light">JPG, PNG, WEBP - Max 10MB</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </div>
              ) : (
                <div className="relative">
                  <div className="aspect-square bg-muted overflow-hidden">
                    <img src={productPreview} alt="Product preview" className="w-full h-full object-contain" />
                  </div>
                  <button
                    onClick={onRemoveProduct}
                    className="absolute top-2 right-2 w-7 h-7 bg-background/80 border border-border flex items-center justify-center hover:bg-destructive hover:text-destructive-foreground transition-colors"
                  >
                    <FiX className="w-3 h-3" />
                  </button>
                  <p className="text-xs text-muted-foreground mt-2 font-light tracking-wider truncate">{productFile?.name}</p>
                </div>
              )}

              <div className="space-y-2">
                <Label className="text-xs tracking-wider uppercase font-light text-muted-foreground">Category</Label>
                <Select value={selectedCategory} onValueChange={onCategoryChange}>
                  <SelectTrigger className="text-sm font-light tracking-wider">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat} className="text-sm font-light tracking-wider">{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs tracking-wider uppercase font-light text-muted-foreground">Additional Notes (Optional)</Label>
                <Textarea
                  value={additionalNotes}
                  onChange={(e) => onNotesChange(e.target.value)}
                  placeholder="Add specific styling instructions, background preferences, pose direction..."
                  className="text-sm font-light tracking-wider resize-none h-20"
                />
              </div>
            </CardContent>
          </Card>

          {/* Center Panel - Model Selection */}
          <Card className="border border-border shadow-sm">
            <CardHeader>
              <CardTitle className="text-sm tracking-wider uppercase font-light flex items-center gap-2">
                <FiUser className="w-4 h-4" /> Select Model
              </CardTitle>
              <div className="flex items-center gap-2 mt-2">
                <Button
                  variant={genderFilter === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setGenderFilter('all')}
                  className="text-xs tracking-wider font-light h-7 px-3"
                >
                  All
                </Button>
                {GENDER_OPTIONS.map((g) => (
                  <Button
                    key={g}
                    variant={genderFilter === g ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setGenderFilter(g)}
                    className="text-xs tracking-wider font-light h-7 px-3"
                  >
                    {g}
                  </Button>
                ))}
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[460px] pr-2">
                <div className="grid grid-cols-2 gap-2">
                  {filteredModels.map((model) => {
                    const isSelected = selectedModel?.id === model.id
                    return (
                      <button
                        key={model.id}
                        onClick={() => onModelSelect(model)}
                        className={`text-left border transition-all duration-200 overflow-hidden ${isSelected ? 'border-primary bg-primary/5 shadow-sm' : 'border-border hover:border-primary/40 hover:bg-secondary/30'}`}
                      >
                        <ModelAvatar model={model} size="sm" />
                        <div className="px-3 py-2">
                          <p className="text-xs font-light tracking-wider truncate">{model.name}</p>
                          <p className="text-[10px] text-muted-foreground font-light tracking-wider mt-0.5">{model.gender} / {model.ageRange}</p>
                          {isSelected && (
                            <div className="mt-1 flex items-center gap-1 text-primary">
                              <FiCheck className="w-3 h-3" />
                              <span className="text-[10px] tracking-wider">Selected</span>
                            </div>
                          )}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Right Panel - Preview & Generate */}
          <Card className="border border-border shadow-sm">
            <CardHeader>
              <CardTitle className="text-sm tracking-wider uppercase font-light flex items-center gap-2">
                <HiOutlineSparkles className="w-4 h-4" /> Preview & Generate
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <p className="text-xs tracking-wider uppercase font-light text-muted-foreground">Product</p>
                {productPreview ? (
                  <div className="aspect-video bg-muted overflow-hidden">
                    <img src={productPreview} alt="Product" className="w-full h-full object-contain" />
                  </div>
                ) : (
                  <div className="aspect-video bg-muted flex items-center justify-center border border-dashed border-border">
                    <p className="text-xs text-muted-foreground font-light tracking-wider">No product uploaded</p>
                  </div>
                )}
                {selectedCategory && (
                  <Badge variant="secondary" className="text-xs font-light tracking-wider">{selectedCategory}</Badge>
                )}
              </div>

              <Separator />

              <div className="space-y-3">
                <p className="text-xs tracking-wider uppercase font-light text-muted-foreground">Model</p>
                {selectedModel ? (
                  <div className="p-3 border border-border bg-secondary/30">
                    <p className="text-sm font-light tracking-wider">{selectedModel.name}</p>
                    <p className="text-xs text-muted-foreground font-light tracking-wider mt-1">{selectedModel.gender} / {selectedModel.ethnicity}</p>
                    <p className="text-xs text-muted-foreground font-light mt-1 leading-relaxed">{selectedModel.description}</p>
                  </div>
                ) : (
                  <div className="p-3 border border-dashed border-border">
                    <p className="text-xs text-muted-foreground font-light tracking-wider">No model selected</p>
                  </div>
                )}
              </div>

              {additionalNotes && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <p className="text-xs tracking-wider uppercase font-light text-muted-foreground">Notes</p>
                    <p className="text-xs text-foreground font-light leading-relaxed">{additionalNotes}</p>
                  </div>
                </>
              )}

              <Separator />

              <Button
                onClick={onGenerate}
                disabled={!canGenerate}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 tracking-wider text-sm font-light h-11 disabled:opacity-40"
              >
                <HiOutlineSparkles className="mr-2 w-4 h-4" />
                Generate Photoshoot
              </Button>

              {!canGenerate && !isGenerating && (
                <p className="text-xs text-muted-foreground text-center font-light tracking-wider">
                  {!productFile ? 'Upload a product image' : !selectedCategory ? 'Select a category' : !selectedModel ? 'Select a model' : ''}
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

function ModelGalleryScreen({ favoriteModels, onToggleFavorite }: { favoriteModels: string[]; onToggleFavorite: (id: string) => void }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [genderFilters, setGenderFilters] = useState<string[]>([])
  const [ethnicityFilters, setEthnicityFilters] = useState<string[]>([])
  const [ageFilters, setAgeFilters] = useState<string[]>([])
  const [selectedModelDetail, setSelectedModelDetail] = useState<AIModelType | null>(null)

  const toggleFilter = (arr: string[], val: string, setter: (v: string[]) => void) => {
    if (arr.includes(val)) {
      setter(arr.filter((v) => v !== val))
    } else {
      setter([...arr, val])
    }
  }

  const filteredModels = AI_MODELS.filter((m) => {
    if (searchQuery && !m.name.toLowerCase().includes(searchQuery.toLowerCase())) return false
    if (genderFilters.length > 0 && !genderFilters.includes(m.gender)) return false
    if (ethnicityFilters.length > 0 && !ethnicityFilters.includes(m.ethnicity)) return false
    if (ageFilters.length > 0 && !ageFilters.includes(m.ageRange)) return false
    return true
  })

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif text-2xl font-light tracking-wider">Model Gallery</h2>
        <p className="text-sm text-muted-foreground tracking-wider mt-1 font-light">Browse and discover AI models for your photoshoots</p>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search models by name..."
            className="pl-10 text-sm font-light tracking-wider"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Filters sidebar */}
        <Card className="border border-border shadow-sm lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-xs tracking-wider uppercase font-light flex items-center gap-2">
              <FiFilter className="w-3 h-3" /> Filters
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p className="text-xs tracking-wider uppercase font-light text-muted-foreground">Gender</p>
              {GENDER_OPTIONS.map((g) => (
                <div key={g} className="flex items-center gap-2">
                  <Checkbox
                    id={`gender-${g}`}
                    checked={genderFilters.includes(g)}
                    onCheckedChange={() => toggleFilter(genderFilters, g, setGenderFilters)}
                  />
                  <label htmlFor={`gender-${g}`} className="text-xs font-light tracking-wider cursor-pointer">{g}</label>
                </div>
              ))}
            </div>
            <Separator />
            <div className="space-y-2">
              <p className="text-xs tracking-wider uppercase font-light text-muted-foreground">Ethnicity</p>
              <ScrollArea className="h-40">
                {ETHNICITY_OPTIONS.map((e) => (
                  <div key={e} className="flex items-center gap-2 py-0.5">
                    <Checkbox
                      id={`eth-${e}`}
                      checked={ethnicityFilters.includes(e)}
                      onCheckedChange={() => toggleFilter(ethnicityFilters, e, setEthnicityFilters)}
                    />
                    <label htmlFor={`eth-${e}`} className="text-xs font-light tracking-wider cursor-pointer">{e}</label>
                  </div>
                ))}
              </ScrollArea>
            </div>
            <Separator />
            <div className="space-y-2">
              <p className="text-xs tracking-wider uppercase font-light text-muted-foreground">Age Range</p>
              {AGE_OPTIONS.map((a) => (
                <div key={a} className="flex items-center gap-2">
                  <Checkbox
                    id={`age-${a}`}
                    checked={ageFilters.includes(a)}
                    onCheckedChange={() => toggleFilter(ageFilters, a, setAgeFilters)}
                  />
                  <label htmlFor={`age-${a}`} className="text-xs font-light tracking-wider cursor-pointer">{a}</label>
                </div>
              ))}
            </div>
            {(genderFilters.length > 0 || ethnicityFilters.length > 0 || ageFilters.length > 0) && (
              <>
                <Separator />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { setGenderFilters([]); setEthnicityFilters([]); setAgeFilters([]) }}
                  className="w-full text-xs tracking-wider font-light"
                >
                  Clear All Filters
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        {/* Model grid */}
        <div className="lg:col-span-3">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-muted-foreground tracking-wider font-light">{filteredModels.length} model{filteredModels.length !== 1 ? 's' : ''} found</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {filteredModels.map((model) => {
              const isFav = favoriteModels.includes(model.id)
              return (
                <Card key={model.id} className="border border-border shadow-sm overflow-hidden group cursor-pointer" onClick={() => setSelectedModelDetail(model)}>
                  <div className="relative">
                    <ModelAvatar model={model} size="md" />
                    <button
                      onClick={(e) => { e.stopPropagation(); onToggleFavorite(model.id) }}
                      className={`absolute top-2 right-2 w-7 h-7 flex items-center justify-center transition-colors z-20 ${isFav ? 'text-primary' : 'text-muted-foreground hover:text-primary'}`}
                    >
                      {isFav ? <FiHeart className="w-4 h-4 fill-current" /> : <FiHeart className="w-4 h-4" />}
                    </button>
                  </div>
                  <CardContent className="pt-3 pb-3 px-3">
                    <p className="text-xs font-light tracking-wider">{model.name}</p>
                    <p className="text-[10px] text-muted-foreground font-light tracking-wider mt-0.5">{model.gender} / {model.ethnicity}</p>
                    <p className="text-[10px] text-muted-foreground font-light mt-1 leading-relaxed line-clamp-2">{model.description}</p>
                  </CardContent>
                </Card>
              )
            })}
          </div>
          {filteredModels.length === 0 && (
            <div className="text-center py-12">
              <FiSearch className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground tracking-wider font-light">No models match your filters</p>
            </div>
          )}
        </div>
      </div>

      {/* Model Detail Dialog */}
      <Dialog open={!!selectedModelDetail} onOpenChange={(open) => { if (!open) setSelectedModelDetail(null) }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif text-lg font-light tracking-wider">{selectedModelDetail?.name}</DialogTitle>
            <DialogDescription className="text-xs tracking-wider font-light">{selectedModelDetail?.gender} / {selectedModelDetail?.ethnicity} / {selectedModelDetail?.ageRange}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="aspect-[3/4] overflow-hidden">
              {selectedModelDetail && <ModelAvatar model={selectedModelDetail} size="lg" />}
            </div>
            <div>
              <p className="text-xs tracking-wider uppercase font-light text-muted-foreground mb-1">Description</p>
              <p className="text-sm font-light leading-relaxed">{selectedModelDetail?.description}</p>
            </div>
            <div className="flex gap-2">
              <Badge variant="secondary" className="text-xs font-light tracking-wider">{selectedModelDetail?.gender}</Badge>
              <Badge variant="secondary" className="text-xs font-light tracking-wider">{selectedModelDetail?.ethnicity}</Badge>
              <Badge variant="secondary" className="text-xs font-light tracking-wider">{selectedModelDetail?.ageRange}</Badge>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function MyGenerationsScreen({
  generations,
  onDelete,
  onDownload,
}: {
  generations: GenerationRecord[]
  onDelete: (id: string) => void
  onDownload: (url: string) => void
}) {
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [selectedGen, setSelectedGen] = useState<GenerationRecord | null>(null)

  const filtered = generations.filter((g) => {
    if (searchQuery && !g.productName.toLowerCase().includes(searchQuery.toLowerCase())) return false
    if (categoryFilter !== 'all' && g.category !== categoryFilter) return false
    return true
  })

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif text-2xl font-light tracking-wider">My Generations</h2>
        <p className="text-sm text-muted-foreground tracking-wider mt-1 font-light">View and manage all your AI-generated fashion photography</p>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by product name..."
            className="pl-10 text-sm font-light tracking-wider"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-40 text-sm font-light tracking-wider">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-sm font-light tracking-wider">All Categories</SelectItem>
            {CATEGORIES.map((cat) => (
              <SelectItem key={cat} value={cat} className="text-sm font-light tracking-wider">{cat}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <Card className="border border-border shadow-sm">
          <CardContent className="py-16 text-center">
            <FiImage className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
            <p className="text-sm text-muted-foreground tracking-wider font-light">
              {generations.length === 0 ? 'No generations yet' : 'No results match your search'}
            </p>
            {generations.length === 0 && (
              <p className="text-xs text-muted-foreground mt-2 font-light tracking-wider">Create your first photoshoot to see it here</p>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((gen) => (
            <Card key={gen.id} className="border border-border shadow-sm overflow-hidden group">
              <div className="aspect-[4/3] bg-muted relative cursor-pointer" onClick={() => setSelectedGen(gen)}>
                {gen.imageUrl ? (
                  <img src={gen.imageUrl} alt={gen.productName} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <FiImage className="w-8 h-8 text-muted-foreground" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <FiZoomIn className="w-6 h-6 text-white" />
                </div>
              </div>
              <CardContent className="pt-3 pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-light tracking-wider truncate">{gen.productName}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="text-[10px] font-light tracking-wider">{gen.category}</Badge>
                      <span className="text-[10px] text-muted-foreground font-light">{gen.modelName}</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground font-light mt-1">{gen.date}</p>
                  </div>
                  <div className="flex items-center gap-1 ml-2">
                    {gen.imageUrl && (
                      <button
                        onClick={() => onDownload(gen.imageUrl)}
                        className="w-7 h-7 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <FiDownload className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      onClick={() => onDelete(gen.id)}
                      className="w-7 h-7 flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <FiTrash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Generation Detail Dialog */}
      <Dialog open={!!selectedGen} onOpenChange={(open) => { if (!open) setSelectedGen(null) }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif text-lg font-light tracking-wider">{selectedGen?.productName}</DialogTitle>
            <DialogDescription className="text-xs tracking-wider font-light">{selectedGen?.category} / {selectedGen?.modelName} / {selectedGen?.date}</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="aspect-[3/4] bg-muted overflow-hidden">
              {selectedGen?.imageUrl ? (
                <img src={selectedGen.imageUrl} alt={selectedGen.productName} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <FiImage className="w-10 h-10 text-muted-foreground" />
                </div>
              )}
            </div>
            <div className="space-y-3">
              {selectedGen?.response?.image_description && (
                <div>
                  <p className="text-xs tracking-wider uppercase font-light text-muted-foreground mb-1">Image Description</p>
                  {renderMarkdown(selectedGen.response.image_description)}
                </div>
              )}
              {selectedGen?.response?.product_details && (
                <div>
                  <p className="text-xs tracking-wider uppercase font-light text-muted-foreground mb-1">Product Details</p>
                  {renderMarkdown(selectedGen.response.product_details)}
                </div>
              )}
              {selectedGen?.response?.model_details && (
                <div>
                  <p className="text-xs tracking-wider uppercase font-light text-muted-foreground mb-1">Model Details</p>
                  {renderMarkdown(selectedGen.response.model_details)}
                </div>
              )}
              {selectedGen?.response?.styling_notes && (
                <div>
                  <p className="text-xs tracking-wider uppercase font-light text-muted-foreground mb-1">Styling Notes</p>
                  {renderMarkdown(selectedGen.response.styling_notes)}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            {selectedGen?.imageUrl && (
              <Button variant="outline" size="sm" onClick={() => { if (selectedGen?.imageUrl) onDownload(selectedGen.imageUrl) }} className="tracking-wider text-xs font-light">
                <FiDownload className="mr-1 w-3 h-3" /> Download
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// --- Main Page ---

export default function Page() {
  const [activeScreen, setActiveScreen] = useState('dashboard')
  const [productFile, setProductFile] = useState<File | null>(null)
  const [productPreview, setProductPreview] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedModel, setSelectedModel] = useState<AIModelType | null>(null)
  const [additionalNotes, setAdditionalNotes] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationResult, setGenerationResult] = useState<{ imageUrl: string; response: { image_description: string; product_details: string; model_details: string; styling_notes: string } } | null>(null)
  const [generations, setGenerations] = useState<GenerationRecord[]>([])
  const [favoriteModels, setFavoriteModels] = useState<string[]>([])
  const [statusMessage, setStatusMessage] = useState<StatusMessage | null>(null)
  const [sampleDataOn, setSampleDataOn] = useState(false)

  // Sample data effect
  useEffect(() => {
    if (sampleDataOn && generations.length === 0) {
      const sampleGenerations: GenerationRecord[] = [
        {
          id: 'sample-1',
          productName: 'Silk Evening Blouse',
          category: 'Upper Body',
          modelName: 'Aria Chen',
          imageUrl: '',
          productPreviewUrl: '',
          response: { image_description: 'Elegant studio photograph featuring a silk evening blouse in champagne gold. Natural fabric draping with soft directional lighting.', product_details: 'Champagne gold silk blouse with mandarin collar and concealed button placket. Lightweight, breathable fabric with subtle sheen.', model_details: 'Aria Chen, Female, East Asian, Young Adult. Elegant pose, straight black hair falling over shoulders, warm skin tone complementing the champagne fabric.', styling_notes: 'Studio setting with warm neutral backdrop. Key light from upper left creating gentle shadows. Hair styled naturally, minimal accessories to keep focus on the garment.' },
          date: '2026-02-13',
        },
        {
          id: 'sample-2',
          productName: 'Tailored Linen Trousers',
          category: 'Lower Body',
          modelName: 'Marcus Johnson',
          imageUrl: '',
          productPreviewUrl: '',
          response: { image_description: 'Clean editorial photograph of tailored linen trousers in slate grey. Sharp creases, relaxed fit through the leg.', product_details: 'Slate grey linen trousers with pressed front creases, belt loops, and tapered leg. Breathable weave suitable for warm-weather formal wear.', model_details: 'Marcus Johnson, Male, African American, Adult. Confident stance, athletic build creating a strong silhouette.', styling_notes: 'High-contrast studio lighting on white cyclorama. Full-length shot emphasizing the trouser silhouette. Paired with minimal white shirt to keep focus on the product.' },
          date: '2026-02-12',
        },
        {
          id: 'sample-3',
          productName: 'Leather Ankle Boots',
          category: 'Footwear',
          modelName: 'Emma Larsson',
          imageUrl: '',
          productPreviewUrl: '',
          response: { image_description: 'Detail-focused product photograph of Italian leather ankle boots in cognac brown. Rich texture and precise stitching visible.', product_details: 'Cognac brown Italian leather ankle boots with 3-inch block heel, side zip closure, and Goodyear welt construction.', model_details: 'Emma Larsson, Female, Scandinavian, Adult. Tall, slim build. Shot from mid-calf down to highlight the boots.', styling_notes: 'Warm directional lighting to enhance leather texture. Dark wood floor providing contrast. Shot angle slightly below eye level for a dynamic perspective.' },
          date: '2026-02-11',
        },
      ]
      setGenerations(sampleGenerations)
    } else if (!sampleDataOn) {
      setGenerations((prev) => prev.filter((g) => !g.id.startsWith('sample-')))
    }
  }, [sampleDataOn])

  const handleProductUpload = useCallback((file: File) => {
    setProductFile(file)
    const url = URL.createObjectURL(file)
    setProductPreview(url)
    setStatusMessage(null)
  }, [])

  const handleRemoveProduct = useCallback(() => {
    if (productPreview) {
      URL.revokeObjectURL(productPreview)
    }
    setProductFile(null)
    setProductPreview(null)
  }, [productPreview])

  const handleGenerate = useCallback(async () => {
    if (!productFile || !selectedModel || !selectedCategory) return

    setIsGenerating(true)
    setStatusMessage({ type: 'info', text: 'Uploading product image...' })
    setGenerationResult(null)

    try {
      // Step 1: Upload the product image
      const uploadResult = await uploadFiles(productFile)

      if (!uploadResult.success || !Array.isArray(uploadResult.asset_ids) || uploadResult.asset_ids.length === 0) {
        setStatusMessage({ type: 'error', text: 'Failed to upload product image. Please try again.' })
        setIsGenerating(false)
        return
      }

      setStatusMessage({ type: 'info', text: 'Generating your photoshoot...' })

      // Step 2: Build the prompt
      const promptMessage = `Generate a photorealistic fashion photography image.

Product Category: ${selectedCategory}
Product Description: A ${selectedCategory.toLowerCase()} apparel item uploaded by the user.
${additionalNotes ? `Additional Notes: ${additionalNotes}` : ''}

AI Model Details:
- Name: ${selectedModel.name}
- Gender: ${selectedModel.gender}
- Ethnicity: ${selectedModel.ethnicity}
- Age Range: ${selectedModel.ageRange}
- Physical Description: ${selectedModel.description}

Please generate a professional studio-quality fashion photograph of this model wearing the uploaded product. Ensure natural garment placement, realistic fabric draping, accurate color reproduction, and professional studio lighting.`

      // Step 3: Call the agent
      const result = await callAIAgent(promptMessage, AGENT_ID, { assets: uploadResult.asset_ids })

      if (!result.success) {
        setStatusMessage({ type: 'error', text: result?.error ?? result?.response?.message ?? 'Generation failed. Please try again.' })
        setIsGenerating(false)
        return
      }

      // Step 4: Extract the generated image
      const artifactFiles = result?.module_outputs?.artifact_files
      let imageUrl = ''
      if (Array.isArray(artifactFiles) && artifactFiles.length > 0) {
        imageUrl = artifactFiles[0]?.file_url ?? ''
      }

      // Step 5: Extract text response
      const responseData = {
        image_description: result?.response?.result?.image_description ?? '',
        product_details: result?.response?.result?.product_details ?? '',
        model_details: result?.response?.result?.model_details ?? '',
        styling_notes: result?.response?.result?.styling_notes ?? '',
      }

      setGenerationResult({ imageUrl, response: responseData })
      setStatusMessage({ type: 'success', text: 'Photoshoot generated successfully!' })

    } catch (err) {
      setStatusMessage({ type: 'error', text: 'An unexpected error occurred. Please try again.' })
    } finally {
      setIsGenerating(false)
    }
  }, [productFile, selectedModel, selectedCategory, additionalNotes])

  const handleSaveAndNew = useCallback(() => {
    if (generationResult) {
      const newGen: GenerationRecord = {
        id: generateId(),
        productName: productFile?.name ?? 'Untitled Product',
        category: selectedCategory,
        modelName: selectedModel?.name ?? 'Unknown Model',
        imageUrl: generationResult.imageUrl,
        productPreviewUrl: productPreview ?? '',
        response: generationResult.response,
        date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
      }
      setGenerations((prev) => [newGen, ...prev])
    }

    // Reset for new photoshoot
    setGenerationResult(null)
    setProductFile(null)
    setProductPreview(null)
    setSelectedCategory('')
    setSelectedModel(null)
    setAdditionalNotes('')
    setStatusMessage(null)
  }, [generationResult, productFile, selectedCategory, selectedModel, productPreview])

  const handleRegenerate = useCallback(() => {
    setGenerationResult(null)
    setStatusMessage(null)
    handleGenerate()
  }, [handleGenerate])

  const handleTryDifferentModel = useCallback(() => {
    // Save current generation first
    if (generationResult) {
      const newGen: GenerationRecord = {
        id: generateId(),
        productName: productFile?.name ?? 'Untitled Product',
        category: selectedCategory,
        modelName: selectedModel?.name ?? 'Unknown Model',
        imageUrl: generationResult.imageUrl,
        productPreviewUrl: productPreview ?? '',
        response: generationResult.response,
        date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
      }
      setGenerations((prev) => [newGen, ...prev])
    }
    setSelectedModel(null)
    setGenerationResult(null)
    setStatusMessage(null)
  }, [generationResult, productFile, selectedCategory, selectedModel, productPreview])

  const handleDownload = useCallback(() => {
    if (generationResult?.imageUrl) {
      window.open(generationResult.imageUrl, '_blank')
    }
  }, [generationResult])

  const handleDownloadUrl = useCallback((url: string) => {
    if (url) {
      window.open(url, '_blank')
    }
  }, [])

  const handleDeleteGeneration = useCallback((id: string) => {
    setGenerations((prev) => prev.filter((g) => g.id !== id))
  }, [])

  const handleToggleFavorite = useCallback((modelId: string) => {
    setFavoriteModels((prev) =>
      prev.includes(modelId) ? prev.filter((id) => id !== modelId) : [...prev, modelId]
    )
  }, [])

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Sidebar activeScreen={activeScreen} onNavigate={setActiveScreen} />

      <main className="ml-60 min-h-screen">
        <div className="px-8 py-6">
          {/* Top bar with sample data toggle */}
          <div className="flex items-center justify-end mb-6">
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground tracking-wider font-light">Sample Data</span>
              <button
                onClick={() => setSampleDataOn(!sampleDataOn)}
                className={`relative w-10 h-5 rounded-full transition-colors duration-200 ${sampleDataOn ? 'bg-primary' : 'bg-border'}`}
              >
                <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${sampleDataOn ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </button>
            </div>
          </div>

          {/* Screens */}
          {activeScreen === 'dashboard' && (
            <DashboardScreen generations={generations} onNavigate={setActiveScreen} />
          )}
          {activeScreen === 'new-photoshoot' && (
            <NewPhotoshootScreen
              productFile={productFile}
              productPreview={productPreview}
              selectedCategory={selectedCategory}
              selectedModel={selectedModel}
              additionalNotes={additionalNotes}
              isGenerating={isGenerating}
              generationResult={generationResult}
              statusMessage={statusMessage}
              onProductUpload={handleProductUpload}
              onRemoveProduct={handleRemoveProduct}
              onCategoryChange={setSelectedCategory}
              onModelSelect={setSelectedModel}
              onNotesChange={setAdditionalNotes}
              onGenerate={handleGenerate}
              onRegenerate={handleRegenerate}
              onTryDifferentModel={handleTryDifferentModel}
              onSaveAndNew={handleSaveAndNew}
              onDownload={handleDownload}
            />
          )}
          {activeScreen === 'model-gallery' && (
            <ModelGalleryScreen
              favoriteModels={favoriteModels}
              onToggleFavorite={handleToggleFavorite}
            />
          )}
          {activeScreen === 'my-generations' && (
            <MyGenerationsScreen
              generations={generations}
              onDelete={handleDeleteGeneration}
              onDownload={handleDownloadUrl}
            />
          )}
        </div>
      </main>
    </div>
  )
}
