import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Upload,
  X,
  MapPin,
  Phone,
  Mail,
  Clock,
  Save,
  Image as ImageIcon
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { mockBusinesses } from '@/data/mockData'

interface BusinessImages {
  url: string
  file?: File
}

interface OpeningHours {
  [key: string]: {
    open: string
    close: string
    closed: boolean
  }
}

const daysOfWeek = [
  { key: 'sunday', label: 'Domingo' },
  { key: 'monday', label: 'Segunda' },
  { key: 'tuesday', label: 'Terça' },
  { key: 'wednesday', label: 'Quarta' },
  { key: 'thursday', label: 'Quinta' },
  { key: 'friday', label: 'Sexta' },
  { key: 'saturday', label: 'Sábado' },
]

export function ConfiguracoesEstabelecimento() {
  const navigate = useNavigate()
  const [images, setImages] = useState<BusinessImages[]>([])
  const [description, setDescription] = useState('')
  const [address, setAddress] = useState({
    street: '',
    neighborhood: '',
    city: '',
    state: '',
    zipCode: ''
  })
  const [contact, setContact] = useState({
    phone: '',
    email: ''
  })
  const [openingHours, setOpeningHours] = useState<OpeningHours>({
    sunday: { open: '10:00', close: '16:00', closed: false },
    monday: { open: '09:00', close: '19:00', closed: false },
    tuesday: { open: '09:00', close: '19:00', closed: false },
    wednesday: { open: '09:00', close: '19:00', closed: false },
    thursday: { open: '09:00', close: '19:00', closed: false },
    friday: { open: '09:00', close: '20:00', closed: false },
    saturday: { open: '09:00', close: '18:00', closed: false },
  })

  // Carregar dados do estabelecimento selecionado
  useEffect(() => {
    const selectedBusinessId = localStorage.getItem('selected_business_id')
    if (selectedBusinessId) {
      const business = mockBusinesses.find(b => b.id === selectedBusinessId)
      if (business) {
        setDescription(business.description)
        setAddress({
          street: business.address.street,
          neighborhood: business.address.neighborhood,
          city: business.address.city,
          state: business.address.state,
          zipCode: business.address.zipCode
        })
        setContact({
          phone: business.phone,
          email: business.email
        })
        // Carregar imagens existentes
        if (business.image) {
          setImages([{ url: business.image }])
        }
      }
    }
  }, [])

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files) {
      const newImages: BusinessImages[] = []
      const remainingSlots = 5 - images.length

      for (let i = 0; i < Math.min(files.length, remainingSlots); i++) {
        const file = files[i]
        const url = URL.createObjectURL(file)
        newImages.push({ url, file })
      }

      setImages([...images, ...newImages])
    }
  }

  const handleRemoveImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index)
    setImages(newImages)
  }

  const handleOpeningHourChange = (day: string, field: 'open' | 'close', value: string) => {
    setOpeningHours({
      ...openingHours,
      [day]: {
        ...openingHours[day],
        [field]: value
      }
    })
  }

  const handleDayClosedToggle = (day: string) => {
    setOpeningHours({
      ...openingHours,
      [day]: {
        ...openingHours[day],
        closed: !openingHours[day].closed
      }
    })
  }

  const handleSave = () => {
    // TODO: Implementar lógica de salvamento
    console.log('Salvando configurações...', {
      images,
      description,
      address,
      contact,
      openingHours
    })
    alert('Configurações salvas com sucesso!')
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-black/80 backdrop-blur-xl border-b border-gold/20 sticky top-0 z-50"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => navigate(-1)}
                className="text-gray-400 hover:text-white hover:bg-white/5"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-gold to-yellow-600 bg-clip-text text-transparent">
                  Configurações do Estabelecimento
                </h1>
                <p className="text-sm text-gray-400 mt-1">
                  Gerencie as informações do seu estabelecimento
                </p>
              </div>
            </div>
            <Button
              onClick={handleSave}
              className="bg-gradient-to-r from-gold to-yellow-600 hover:from-yellow-600 hover:to-gold text-black font-semibold"
            >
              <Save className="w-4 h-4 mr-2" />
              Salvar Alterações
            </Button>
          </div>
        </div>
      </motion.header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="space-y-8">
          {/* Galeria de Fotos */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="bg-white/5 backdrop-blur-sm border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-gold" />
                  Galeria de Fotos
                </CardTitle>
                <p className="text-sm text-gray-400">
                  Adicione até 5 fotos do seu estabelecimento
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  {/* Imagens Carregadas */}
                  {images.map((image, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="relative aspect-square rounded-lg overflow-hidden border-2 border-white/10 group"
                    >
                      <img
                        src={image.url}
                        alt={`Imagem ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <button
                        onClick={() => handleRemoveImage(index)}
                        className="absolute top-2 right-2 w-8 h-8 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-4 h-4 text-white" />
                      </button>
                    </motion.div>
                  ))}

                  {/* Slots para Upload */}
                  {images.length < 5 && (
                    <label className="aspect-square rounded-lg border-2 border-dashed border-white/20 hover:border-gold/50 flex flex-col items-center justify-center cursor-pointer transition-colors bg-white/5 hover:bg-white/10">
                      <Upload className="w-8 h-8 text-gray-400 mb-2" />
                      <span className="text-xs text-gray-400">Adicionar Foto</span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Sobre */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="bg-white/5 backdrop-blur-sm border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Sobre</CardTitle>
                <p className="text-sm text-gray-400">
                  Descreva seu estabelecimento
                </p>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Descreva seu estabelecimento, serviços oferecidos, diferenciais..."
                  className="min-h-[120px] bg-white/5 border-white/10 text-white placeholder-gray-500 focus:border-gold/50"
                />
              </CardContent>
            </Card>
          </motion.div>

          {/* Informações de Contato */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="bg-white/5 backdrop-blur-sm border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-gold" />
                  Informações de Contato
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Endereço */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-white">Endereço</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <Label htmlFor="street" className="text-gray-300">Rua</Label>
                      <Input
                        id="street"
                        value={address.street}
                        onChange={(e) => setAddress({ ...address, street: e.target.value })}
                        className="bg-white/5 border-white/10 text-white placeholder-gray-500 focus:border-gold/50"
                        placeholder="Nome da rua, número"
                      />
                    </div>
                    <div>
                      <Label htmlFor="neighborhood" className="text-gray-300">Bairro</Label>
                      <Input
                        id="neighborhood"
                        value={address.neighborhood}
                        onChange={(e) => setAddress({ ...address, neighborhood: e.target.value })}
                        className="bg-white/5 border-white/10 text-white placeholder-gray-500 focus:border-gold/50"
                      />
                    </div>
                    <div>
                      <Label htmlFor="city" className="text-gray-300">Cidade</Label>
                      <Input
                        id="city"
                        value={address.city}
                        onChange={(e) => setAddress({ ...address, city: e.target.value })}
                        className="bg-white/5 border-white/10 text-white placeholder-gray-500 focus:border-gold/50"
                      />
                    </div>
                    <div>
                      <Label htmlFor="state" className="text-gray-300">Estado</Label>
                      <Input
                        id="state"
                        value={address.state}
                        onChange={(e) => setAddress({ ...address, state: e.target.value })}
                        className="bg-white/5 border-white/10 text-white placeholder-gray-500 focus:border-gold/50"
                        placeholder="SP"
                      />
                    </div>
                    <div>
                      <Label htmlFor="zipCode" className="text-gray-300">CEP</Label>
                      <Input
                        id="zipCode"
                        value={address.zipCode}
                        onChange={(e) => setAddress({ ...address, zipCode: e.target.value })}
                        className="bg-white/5 border-white/10 text-white placeholder-gray-500 focus:border-gold/50"
                        placeholder="00000-000"
                      />
                    </div>
                  </div>
                </div>

                {/* Contato */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-white">Contato</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="phone" className="text-gray-300 flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        Telefone
                      </Label>
                      <Input
                        id="phone"
                        value={contact.phone}
                        onChange={(e) => setContact({ ...contact, phone: e.target.value })}
                        className="bg-white/5 border-white/10 text-white placeholder-gray-500 focus:border-gold/50"
                        placeholder="(11) 99999-9999"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email" className="text-gray-300 flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        Email
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={contact.email}
                        onChange={(e) => setContact({ ...contact, email: e.target.value })}
                        className="bg-white/5 border-white/10 text-white placeholder-gray-500 focus:border-gold/50"
                        placeholder="contato@estabelecimento.com"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Horário de Funcionamento */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="bg-white/5 backdrop-blur-sm border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Clock className="w-5 h-5 text-gold" />
                  Horário de Funcionamento
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {daysOfWeek.map((day) => (
                    <div key={day.key} className="flex items-center gap-4">
                      <div className="w-24 flex-shrink-0">
                        <span className="text-sm font-medium text-white">{day.label}</span>
                      </div>
                      <div className="flex items-center gap-4 flex-1">
                        <Input
                          type="time"
                          value={openingHours[day.key].open}
                          onChange={(e) => handleOpeningHourChange(day.key, 'open', e.target.value)}
                          disabled={openingHours[day.key].closed}
                          className="bg-white/5 border-white/10 text-white focus:border-gold/50 disabled:opacity-50"
                        />
                        <span className="text-gray-400">-</span>
                        <Input
                          type="time"
                          value={openingHours[day.key].close}
                          onChange={(e) => handleOpeningHourChange(day.key, 'close', e.target.value)}
                          disabled={openingHours[day.key].closed}
                          className="bg-white/5 border-white/10 text-white focus:border-gold/50 disabled:opacity-50"
                        />
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={openingHours[day.key].closed}
                            onChange={() => handleDayClosedToggle(day.key)}
                            className="w-4 h-4 rounded border-white/10 bg-white/5 text-gold focus:ring-gold/50"
                          />
                          <span className="text-sm text-gray-400">Fechado</span>
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
