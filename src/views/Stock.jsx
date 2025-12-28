import { useState, useEffect } from 'react'
import { medicineService, stockService } from '../services/api'
import Button from '../components/ui/Button'
import Loading from '../components/ui/Loading'
import Modal from '../components/ui/Modal'
import StockForm from '../components/stock/StockForm'
import StockCard from '../components/stock/StockCard'
import './Stock.css'

export default function Stock() {
  const [medicines, setMedicines] = useState([])
  const [stockData, setStockData] = useState({}) // { medicineId: { entries: [], total: 0 } }
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      // Carregar medicamentos
      const medicinesData = await medicineService.getAll()
      setMedicines(medicinesData)
      
      // Carregar estoque para cada medicamento
      const stockPromises = medicinesData.map(async (medicine) => {
        const entries = await stockService.getByMedicine(medicine.id)
        const total = entries.reduce((sum, entry) => sum + entry.quantity, 0)
        return { medicineId: medicine.id, entries, total }
      })
      
      const stockResults = await Promise.all(stockPromises)
      
      // Organizar dados de estoque por medicamento
      const stockMap = {}
      stockResults.forEach(result => {
        stockMap[result.medicineId] = {
          entries: result.entries,
          total: result.total
        }
      })
      
      setStockData(stockMap)
    } catch (err) {
      setError('Erro ao carregar dados: ' + err.message)
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddStock = () => {
    if (medicines.length === 0) {
      setError('Cadastre um medicamento antes de adicionar estoque')
      return
    }
    setIsModalOpen(true)
  }

  const handleSaveStock = async (stockData) => {
    try {
      await stockService.add(stockData)
      showSuccess('Estoque adicionado com sucesso!')
      setIsModalOpen(false)
      await loadData()
    } catch (err) {
      throw new Error('Erro ao adicionar estoque: ' + err.message)
    }
  }

  const showSuccess = (message) => {
    setSuccessMessage(message)
    setTimeout(() => setSuccessMessage(''), 3000)
  }

  // Filtrar medicamentos que têm estoque ou foram cadastrados
  const medicinesWithStock = medicines.map(medicine => ({
    medicine,
    stock: stockData[medicine.id] || { entries: [], total: 0 }
  }))

  // Separar em categorias
  const lowStockMedicines = medicinesWithStock.filter(
    item => item.stock.total > 0 && item.stock.total <= 10
  )
  const outOfStockMedicines = medicinesWithStock.filter(
    item => item.stock.total === 0
  )
  const okStockMedicines = medicinesWithStock.filter(
    item => item.stock.total > 10
  )

  if (isLoading) {
    return (
      <div className="stock-view">
        <Loading text="Carregando estoque..." />
      </div>
    )
  }

  return (
    <div className="stock-view">
      <div className="stock-header">
        <div>
          <h2>📦 Estoque</h2>
          <p className="stock-subtitle">
            Controle o estoque dos seus medicamentos
          </p>
        </div>
        <Button variant="primary" onClick={handleAddStock}>
          ➕ Adicionar Estoque
        </Button>
      </div>

      {successMessage && (
        <div className="success-banner fade-in">
          ✅ {successMessage}
        </div>
      )}

      {error && (
        <div className="error-banner fade-in">
          ❌ {error}
        </div>
      )}

      {medicines.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📦</div>
          <h3>Nenhum medicamento cadastrado</h3>
          <p>Cadastre medicamentos primeiro para gerenciar o estoque</p>
        </div>
      ) : (
        <div className="stock-content">
          {/* Alertas de estoque baixo */}
          {lowStockMedicines.length > 0 && (
            <div className="stock-section">
              <h3 className="section-title warning">
                ⚠️ Estoque Baixo ({lowStockMedicines.length})
              </h3>
              <div className="stock-grid">
                {lowStockMedicines.map(({ medicine, stock }) => (
                  <StockCard
                    key={medicine.id}
                    medicine={medicine}
                    stockEntries={stock.entries}
                    totalQuantity={stock.total}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Medicamentos sem estoque */}
          {outOfStockMedicines.length > 0 && (
            <div className="stock-section">
              <h3 className="section-title error">
                ❌ Sem Estoque ({outOfStockMedicines.length})
              </h3>
              <div className="stock-grid">
                {outOfStockMedicines.map(({ medicine, stock }) => (
                  <StockCard
                    key={medicine.id}
                    medicine={medicine}
                    stockEntries={stock.entries}
                    totalQuantity={stock.total}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Medicamentos com estoque OK */}
          {okStockMedicines.length > 0 && (
            <div className="stock-section">
              <h3 className="section-title success">
                ✅ Estoque OK ({okStockMedicines.length})
              </h3>
              <div className="stock-grid">
                {okStockMedicines.map(({ medicine, stock }) => (
                  <StockCard
                    key={medicine.id}
                    medicine={medicine}
                    stockEntries={stock.entries}
                    totalQuantity={stock.total}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      >
        <StockForm
          medicines={medicines}
          onSave={handleSaveStock}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>
    </div>
  )
}
