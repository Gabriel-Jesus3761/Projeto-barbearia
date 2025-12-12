import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate, useParams } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { ArrowLeft, Search, MapPin, Star, Clock, Phone, TrendingUp, Award, ChevronLeft, ChevronRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { businessCategories } from '@/data/mockData'
import { BusinessCategory } from '@/types'
import { getBusinessesByCategory, type Business } from '@/services/businessService'

// Business Card Carousel Component
function BusinessCardCarousel({ business }: { business: Business }) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  // Usar imagens reais do estabelecimento quando disponíveis
  const realImages: string[] = []

  // Adicionar imagem principal se existir
  if (business.image) {
    realImages.push(business.image)
  }

  // Adicionar cover image se existir e for diferente da principal
  if (business.coverImage && business.coverImage !== business.image) {
    realImages.push(business.coverImage)
  }

  // Adicionar galeria se existir
  if (business.gallery && business.gallery.length > 0) {
    business.gallery.forEach(img => {
      if (img && !realImages.includes(img)) {
        realImages.push(img)
      }
    })
  }

  // Usar apenas imagens reais configuradas
  const galleryImages = realImages

  // Pré-carregar todas as imagens ao montar o componente
  useEffect(() => {
    galleryImages.forEach((src) => {
      const img = new Image()
      img.src = src
    })
  }, [galleryImages])

  // Pré-carregar a próxima imagem antes da transição
  useEffect(() => {
    if (galleryImages.length <= 1) return

    const nextIndex = (currentImageIndex + 1) % galleryImages.length
    const img = new Image()
    img.src = galleryImages[nextIndex]
  }, [currentImageIndex, galleryImages])

  // Auto-advance carousel every 7 seconds
  useEffect(() => {
    if (galleryImages.length <= 1) return

    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % galleryImages.length)
    }, 7000)

    return () => clearInterval(interval)
  }, [galleryImages.length])

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation()
    setCurrentImageIndex((prev) => (prev + 1) % galleryImages.length)
  }

  const previousImage = (e: React.MouseEvent) => {
    e.stopPropagation()
    setCurrentImageIndex((prev) => (prev - 1 + galleryImages.length) % galleryImages.length)
  }

  if (galleryImages.length === 0) {
    return (
      <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
        <span className="text-gray-500 text-sm">Sem imagem</span>
      </div>
    )
  }

  return (
    <div className="relative w-full h-full group/carousel">
      {/* Images with AnimatePresence */}
      <AnimatePresence initial={false}>
        <motion.div
          key={`${business.id}-${currentImageIndex}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{
            duration: 1.0,
            ease: [0.43, 0.13, 0.23, 0.96]
          }}
          className="absolute inset-0"
        >
          <img
            src={galleryImages[currentImageIndex]}
            alt={`${business.name} - Foto ${currentImageIndex + 1}`}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </motion.div>
      </AnimatePresence>

      {/* Navigation Buttons */}
      {galleryImages.length > 1 && (
        <>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={previousImage}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/50 backdrop-blur-sm hover:bg-black/70 rounded-full flex items-center justify-center transition-all opacity-0 group-hover/carousel:opacity-100 z-20"
          >
            <ChevronLeft className="w-5 h-5 text-white" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={nextImage}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/50 backdrop-blur-sm hover:bg-black/70 rounded-full flex items-center justify-center transition-all opacity-0 group-hover/carousel:opacity-100 z-20"
          >
            <ChevronRight className="w-5 h-5 text-white" />
          </motion.button>
        </>
      )}

      {/* Pagination Dots */}
      {galleryImages.length > 1 && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
          {galleryImages.map((_, index) => (
            <motion.button
              key={index}
              whileHover={{ scale: 1.2 }}
              onClick={(e) => {
                e.stopPropagation()
                setCurrentImageIndex(index)
              }}
              className={`w-1.5 h-1.5 rounded-full transition-all ${
                index === currentImageIndex
                  ? 'bg-gold w-6'
                  : 'bg-white/50 hover:bg-white/80'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export function EmpresasPorCategoria() {
  const { categoryId } = useParams<{ categoryId: BusinessCategory }>()
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'rating' | 'reviews'>('rating')
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const category = businessCategories.find((cat) => cat.id === categoryId)

  // Carregar estabelecimentos reais do Firestore
  useEffect(() => {
    const loadBusinesses = async () => {
      if (!categoryId) return

      setIsLoading(true)
      try {
        // Mapear o categoryId da URL para a categoria do estabelecimento
        const categoryMap: Record<string, string> = {
          'barbearia': 'Barbearia',
          'salao': 'Salão de Beleza',
          'estetica': 'Clínica Estética',
          'spa': 'Spa',
          'manicure': 'Manicure e Pedicure',
          'massagem': 'Massagem',
          'depilacao': 'Depilação',
          'maquiagem': 'Maquiagem'
        }

        const businessCategory = categoryMap[categoryId]
        if (businessCategory) {
          const realBusinesses = await getBusinessesByCategory(businessCategory)
          setBusinesses(realBusinesses)
        } else {
          // Categoria não mapeada, lista vazia
          setBusinesses([])
        }
      } catch (error) {
        console.error('Erro ao carregar estabelecimentos:', error)
        // Em caso de erro, lista vazia
        setBusinesses([])
      } finally {
        setIsLoading(false)
      }
    }

    loadBusinesses()
  }, [categoryId])

  const filteredBusinesses = businesses
    .filter((business) =>
      business.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      business.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      business.address.neighborhood.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === 'rating') {
        return b.rating - a.rating
      }
      return b.totalReviews - a.totalReviews
    })

  const getTodayHours = (businessId: string) => {
    const business = businesses.find((b) => b.id === businessId)
    if (!business || !business.businessHours) return null

    // Mapear dia da semana (0 = domingo, 1 = segunda, etc.) para string
    const dayMap = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    const today = new Date().getDay()
    const todayString = dayMap[today]

    const todayHours = business.businessHours.find((h) => h.day === todayString)

    if (!todayHours || !todayHours.isOpen) {
      return { isOpen: false, hours: 'Fechado hoje' }
    }

    return { isOpen: true, hours: `${todayHours.open} - ${todayHours.close}` }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gold border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg">Carregando estabelecimentos...</p>
        </div>
      </div>
    )
  }

  if (!category) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Categoria não encontrada</h2>
          <Button
            onClick={() => navigate('/')}
            className="bg-gradient-to-r from-gold to-yellow-600 text-black hover:shadow-xl hover:shadow-gold/50"
          >
            Voltar para início
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Hero Section with Category Info */}
      <div className="relative pt-8 pb-16 overflow-hidden">
        {/* Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-900 to-black" />

        {/* Animated Orbs */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.2, 0.3, 0.2],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-gold/20 to-transparent rounded-full blur-3xl"
          />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl md:text-6xl font-bold text-white mb-4">
              Os Melhores em
              <br />
              <span className="bg-gradient-to-r from-gold via-yellow-400 to-gold bg-clip-text text-transparent">
                {category.name}
              </span>
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Profissionais selecionados com excelência e qualidade garantida
            </p>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="grid grid-cols-2 md:grid-cols-3 gap-6 max-w-3xl mx-auto mb-12"
          >
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 text-center">
              <MapPin className="w-8 h-8 text-gold mx-auto mb-2" />
              <p className="text-3xl font-bold text-white mb-1">{businesses.length}</p>
              <p className="text-sm text-gray-400">Estabelecimentos</p>
            </div>
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 text-center">
              <Star className="w-8 h-8 text-gold mx-auto mb-2" />
              <p className="text-3xl font-bold text-white mb-1">
                {businesses.length > 0
                  ? (businesses.reduce((acc, b) => acc + b.rating, 0) / businesses.length).toFixed(1)
                  : '0.0'
                }
              </p>
              <p className="text-sm text-gray-400">Média de Avaliação</p>
            </div>
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 text-center col-span-2 md:col-span-1">
              <Award className="w-8 h-8 text-gold mx-auto mb-2" />
              <p className="text-3xl font-bold text-white mb-1">
                {businesses.reduce((acc, b) => acc + b.totalReviews, 0)}
              </p>
              <p className="text-sm text-gray-400">Avaliações Totais</p>
            </div>
          </motion.div>

          {/* Search and Filters - Premium */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
          >
            <div className="flex flex-col md:flex-row gap-4 mb-4">
              {/* Search Bar */}
              <div className="flex-1 relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-gold/20 to-purple-500/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative bg-white/5 border border-white/20 rounded-xl flex items-center px-4">
                  <Search className="w-5 h-5 text-gray-400 mr-3" />
                  <Input
                    type="text"
                    placeholder="Buscar estabelecimentos, bairros..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 bg-transparent border-0 text-white placeholder:text-gray-400 focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                </div>
              </div>

              {/* Sort Buttons */}
              <div className="flex gap-2">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSortBy('rating')}
                  className={`flex items-center gap-2 px-4 py-3 rounded-xl font-medium text-sm transition-all ${
                    sortBy === 'rating'
                      ? 'bg-gradient-to-r from-gold to-yellow-600 text-black shadow-lg shadow-gold/20'
                      : 'bg-white/5 border border-white/10 text-white hover:bg-white/10'
                  }`}
                >
                  <Star className="w-4 h-4" />
                  <span className="hidden sm:inline">Melhor Avaliados</span>
                  <span className="sm:hidden">Avaliação</span>
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSortBy('reviews')}
                  className={`flex items-center gap-2 px-4 py-3 rounded-xl font-medium text-sm transition-all ${
                    sortBy === 'reviews'
                      ? 'bg-gradient-to-r from-gold to-yellow-600 text-black shadow-lg shadow-gold/20'
                      : 'bg-white/5 border border-white/10 text-white hover:bg-white/10'
                  }`}
                >
                  <TrendingUp className="w-4 h-4" />
                  <span className="hidden sm:inline">Mais Avaliações</span>
                  <span className="sm:hidden">Popular</span>
                </motion.button>
              </div>
            </div>

            {/* Results Count */}
            <div className="flex items-center justify-between text-sm">
              <p className="text-gray-400">
                <span className="text-white font-semibold">{filteredBusinesses.length}</span> estabelecimento{filteredBusinesses.length !== 1 ? 's' : ''} encontrado{filteredBusinesses.length !== 1 ? 's' : ''}
              </p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Business Grid - Premium */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        {filteredBusinesses.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-12 max-w-md mx-auto">
              <Search className="w-16 h-16 mx-auto text-gray-600 mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">
                Nenhum estabelecimento encontrado
              </h3>
              <p className="text-sm text-gray-400">
                Tente buscar por outro termo ou filtro
              </p>
            </div>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBusinesses.map((business, index) => {
              const todayHours = getTodayHours(business.id)

              return (
                <motion.div
                  key={business.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ y: -8 }}
                  className="group"
                >
                  <Card
                    className="h-full cursor-pointer bg-white/5 backdrop-blur-sm border border-white/10 hover:border-gold/50 hover:shadow-2xl hover:shadow-gold/10 transition-all duration-500 overflow-hidden"
                    onClick={() => navigate(`/empresas/${business.id}`)}
                  >
                    {/* Image Carousel */}
                    <div className="relative h-56 bg-gradient-to-br from-gray-800 to-gray-900 overflow-hidden">
                      <BusinessCardCarousel
                        business={business}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent pointer-events-none" />

                      {/* Badges */}
                      <div className="absolute top-3 left-3 right-3 flex items-start justify-between z-30">
                        <Badge className="bg-gradient-to-r from-gold to-yellow-600 text-black border-0 shadow-lg">
                          <Star className="w-3 h-3 mr-1 fill-black" />
                          {business.rating.toFixed(1)}
                        </Badge>
                        {todayHours && (
                          <Badge
                            className={
                              todayHours.isOpen
                                ? 'bg-green-500/90 backdrop-blur-sm hover:bg-green-600 text-white border-0 shadow-lg'
                                : 'bg-gray-500/90 backdrop-blur-sm hover:bg-gray-600 text-white border-0 shadow-lg'
                            }
                          >
                            <Clock className="w-3 h-3 mr-1" />
                            {todayHours.isOpen ? 'Aberto' : 'Fechado'}
                          </Badge>
                        )}
                      </div>

                      {/* Hover Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-gold/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                    </div>

                    <CardContent className="p-6 relative">
                      {/* Gradient Orb */}
                      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-gold/10 to-transparent rounded-full blur-2xl opacity-0 group-hover:opacity-100 group-hover:scale-150 transition-all duration-500" />

                      {/* Business Name */}
                      <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-gold transition-colors relative z-10">
                        {business.name}
                      </h3>

                      {/* Description */}
                      <p className="text-sm text-gray-400 mb-4 line-clamp-2 relative z-10">
                        {business.description}
                      </p>

                      {/* Address */}
                      <div className="flex items-start gap-2 text-sm text-gray-400 mb-3 relative z-10">
                        <MapPin className="w-4 h-4 text-gold flex-shrink-0 mt-0.5" />
                        <p className="line-clamp-2">
                          {business.address.street}, {business.address.number} - {business.address.neighborhood}
                        </p>
                      </div>

                      {/* Hours */}
                      {todayHours && (
                        <div className="flex items-center gap-2 text-sm text-gray-400 mb-3 relative z-10">
                          <Clock className="w-4 h-4 text-gold" />
                          <p>{todayHours.hours}</p>
                        </div>
                      )}

                      {/* Reviews */}
                      <div className="flex items-center gap-2 text-sm text-gray-400 mb-6 relative z-10">
                        <Star className="w-4 h-4 text-gold fill-gold" />
                        <p>
                          {business.totalReviews} avalia{business.totalReviews !== 1 ? 'ções' : 'ção'}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="grid grid-cols-2 gap-3 relative z-10">
                        <motion.a
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          href={`tel:${business.phone}`}
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all text-sm text-white font-medium"
                        >
                          <Phone className="w-4 h-4" />
                          Ligar
                        </motion.a>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={(e) => {
                            e.stopPropagation()
                            navigate(`/empresas/${business.id}`)
                          }}
                          className="flex items-center justify-center px-4 py-2.5 bg-gradient-to-r from-gold to-yellow-600 text-black rounded-xl font-semibold text-sm hover:shadow-lg hover:shadow-gold/50 transition-all"
                        >
                          Ver Mais
                        </motion.button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
