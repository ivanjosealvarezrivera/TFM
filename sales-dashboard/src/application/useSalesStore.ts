import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Sale, SalesFilters } from '../core/entities/Sale'
// @ts-ignore
import tailwindConfig from '../../tailwind.config.js'

export const useSalesStore = defineStore('sales', () => {
  const twColors = (tailwindConfig as any).theme.extend.colors;
  const rawSales = ref<Sale[]>([])
  const isLoading = ref(false)
  const fileError = ref<string | null>(null)
  
  const filters = ref<SalesFilters>({
    startDate: null,
    endDate: null,
    fabricas: null,
    comunidades: null,
    nomenclaturas: null,
    transportistas: null,
    matriculas: null,
    clientes: null
  })

  // --- Opciones para Filtros (Valores únicos de los datos cargados) ---
  const filterOptions = computed(() => {
    const fabricas = new Set<string>()
    const comunidades = new Set<string>()
    const nomenclaturas = new Set<string>()
    const transportistas = new Set<string>()
    const matriculas = new Set<string>()
    const clientes = new Map<string, string>() // NIF -> Nombre

    rawSales.value.forEach(s => {
      fabricas.add(s.planta)
      comunidades.add(s.comunidad)
      nomenclaturas.add(s.nomenclatura)
      transportistas.add(s.nombreTransportista)
      matriculas.add(s.matricula)
      clientes.set(s.cliente, s.nombreCliente)
    })

    return {
      fabricas: Array.from(fabricas).sort(),
      comunidades: Array.from(comunidades).sort(),
      nomenclaturas: Array.from(nomenclaturas).sort(),
      transportistas: Array.from(transportistas).sort(),
      matriculas: Array.from(matriculas).sort(),
      clientes: Array.from(clientes.entries()).map(([value, label]) => ({ label, value })).sort((a, b) => a.label.localeCompare(b.label))
    }
  })

  const filteredSales = computed(() => {
    return rawSales.value.filter(sale => {
      if (filters.value.startDate && sale.fecha < filters.value.startDate) return false
      if (filters.value.endDate && sale.fecha > filters.value.endDate) return false
      if (filters.value.fabricas?.length && !filters.value.fabricas.includes(sale.planta)) return false
      if (filters.value.comunidades?.length && !filters.value.comunidades.includes(sale.comunidad)) return false
      if (filters.value.nomenclaturas?.length && !filters.value.nomenclaturas.includes(sale.nomenclatura)) return false
      if (filters.value.transportistas?.length && !filters.value.transportistas.includes(sale.nombreTransportista)) return false
      if (filters.value.matriculas?.length && !filters.value.matriculas.includes(sale.matricula)) return false
      if (filters.value.clientes?.length && !filters.value.clientes.includes(sale.cliente)) return false
      return true
    })
  })

  const prevPeriodSales = computed(() => {
    if (!filters.value.startDate || !filters.value.endDate) return []
    
    const start = new Date(filters.value.startDate)
    const end = new Date(filters.value.endDate)
    start.setMonth(start.getMonth() - 1)
    end.setMonth(end.getMonth() - 1)
    
    const startStr = start.toISOString().split('T')[0] || ''
    const endStr = end.toISOString().split('T')[0] || ''

    return rawSales.value.filter(sale => {
      if (!startStr || !endStr) return false
      if (sale.fecha < startStr || sale.fecha > endStr) return false
      if (filters.value.fabricas?.length && !filters.value.fabricas.includes(sale.planta)) return false
      if (filters.value.comunidades?.length && !filters.value.comunidades.includes(sale.comunidad)) return false
      if (filters.value.nomenclaturas?.length && !filters.value.nomenclaturas.includes(sale.nomenclatura)) return false
      if (filters.value.transportistas?.length && !filters.value.transportistas.includes(sale.nombreTransportista)) return false
      if (filters.value.matriculas?.length && !filters.value.matriculas.includes(sale.matricula)) return false
      if (filters.value.clientes?.length && !filters.value.clientes.includes(sale.cliente)) return false
      return true
    })
  })

  const mainAggregates = computed(() => {
    const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
    const byDay: Record<string, number> = {}
    const byMonth: Record<string, number> = {}
    const byPlanta: Record<string, number> = {}
    const byCommunity: Record<string, number> = {}
    const nomenclatures = new Set<string>()
    let totalVol = 0
    let selfVol = 0
    let totalCem = 0
    let validCemCount = 0

    filteredSales.value.forEach(sale => {
      totalVol += sale.cantidad
      
      // By Planta & Community
      byPlanta[sale.planta] = (byPlanta[sale.planta] || 0) + sale.cantidad
      byCommunity[sale.comunidad] = (byCommunity[sale.comunidad] || 0) + sale.cantidad
      
      // By Day
      byDay[sale.fecha] = (byDay[sale.fecha] || 0) + sale.cantidad
      
      // By Month
      const year = sale.fecha.substring(0, 4)
      const monthIdx = parseInt(sale.fecha.substring(5, 7)) - 1
      const monthKey = `${months[monthIdx]} ${year}`
      byMonth[monthKey] = (byMonth[monthKey] || 0) + sale.cantidad

      // Formula & Cement
      nomenclatures.add(sale.nomenclatura)
      if (sale.contenidoCementoReal) {
        totalCem += sale.contenidoCementoReal
        validCemCount++
      }

      // Self consumption
      if (sale.nombreCliente.includes('GENERAL DE HORMIGONES, S.A.')) {
        selfVol += sale.cantidad
      }
    })

    // Sort mappings
    const sortedDays = Object.keys(byDay).sort()
    const sortedMonths = Object.entries(byMonth).sort((a, b) => {
      const partsA = a[0].split(' ')
      const partsB = b[0].split(' ')
      const dateA = new Date(parseInt(partsA[1]!), months.indexOf(partsA[0]!)).getTime()
      const dateB = new Date(parseInt(partsB[1]!), months.indexOf(partsB[0]!)).getTime()
      return dateA - dateB
    })

    // Max sales day calculation
    let maxDayDate = ''
    let maxDayValue = 0
    Object.entries(byDay).forEach(([date, value]) => {
      if (value > maxDayValue) {
        maxDayValue = value
        maxDayDate = date
      }
    })

    let maxDayLabel = null
    if (maxDayDate) {
      const [y, m, d] = maxDayDate.split('-')
      maxDayLabel = { date: `${d}/${m}/${y}`, value: maxDayValue }
    }

    return {
      totalVolume: totalVol,
      volumeByPlanta: byPlanta,
      volumeByCommunity: byCommunity,
      byDay: {
        labels: sortedDays.map(k => {
          const [y, m, d] = k.split('-')
          return `${d}/${m}/${y}`
        }),
        values: sortedDays.map(k => byDay[k]!)
      },
      byMonth: {
        labels: sortedMonths.map(e => e[0]),
        values: sortedMonths.map(e => e[1]!)
      },
      selfConsumptionVolume: selfVol,
      averageCement: validCemCount > 0 ? totalCem / validCemCount : 0,
      uniqueNomenclaturesCount: nomenclatures.size,
      maxSalesDay: maxDayLabel
    }
  })

  // Exponer propiedades individuales derivadas para mantener compatibilidad
  const totalVolume = computed(() => mainAggregates.value.totalVolume)
  const volumeByPlanta = computed(() => mainAggregates.value.volumeByPlanta)
  const volumeByCommunity = computed(() => mainAggregates.value.volumeByCommunity)
  const salesByDay = computed(() => mainAggregates.value.byDay)
  const salesByMonth = computed(() => mainAggregates.value.byMonth)
  const selfConsumptionVolume = computed(() => mainAggregates.value.selfConsumptionVolume)
  const averageCementContent = computed(() => mainAggregates.value.averageCement)
  const uniqueNomenclaturesCount = computed(() => mainAggregates.value.uniqueNomenclaturesCount)
  const maxSalesDay = computed(() => mainAggregates.value.maxSalesDay)

  const prevTotalVolume = computed(() => {
    return prevPeriodSales.value.reduce((acc, sale) => acc + sale.cantidad, 0)
  })

  const volumeVariation = computed(() => {
    const prev = prevTotalVolume.value
    if (prev === 0) return 0
    return ((totalVolume.value - prev) / prev) * 100
  })

  const communityPlotlyData = computed(() => {
    const data = volumeByCommunity.value
    const labels = Object.keys(data)
    const values = Object.values(data)
    
    return [{
      type: 'pie',
      labels: labels,
      values: values,
      hole: 0.4,
      marker: {
        colors: twColors['chart-greens'],
        line: { width: 2, color: twColors['brand-gray'][0] }
      },
      textinfo: 'label+percent',
      hovertemplate: '<b>%{label}</b><br>Volumen: %{value:,.0f} m³<br>%{percent}<extra></extra>'
    }]
  })

  // Cálculos de Medias para Gráficos
  const averageVolumeByPlanta = computed(() => {
    const values = Object.values(volumeByPlanta.value)
    if (values.length === 0) return 0
    return values.reduce((a, b) => a + b, 0) / values.length
  })

  const averageSalesByDay = computed(() => {
    const values = salesByDay.value.values
    if (values.length === 0) return 0
    return (values as number[]).reduce((a, b) => a + b, 0) / values.length
  })

  const averageSalesByMonth = computed(() => {
    const values = salesByMonth.value.values
    if (values.length === 0) return 0
    return (values as number[]).reduce((a, b) => a + b, 0) / values.length
  })

  const formulaTreemapData = computed(() => {
    const data: Record<string, { volume: number; labels: Set<string> }> = {}
    
    filteredSales.value.forEach(sale => {
      if (!data[sale.nomenclatura]) {
        data[sale.nomenclatura] = { volume: 0, labels: new Set() };
      }
      const entry = data[sale.nomenclatura]!;
      entry.volume += sale.cantidad;
      // El grupo contiene la resistencia (ej: HA-25)
      const resistance = sale.grupo.split('-').slice(1).join('-') || 'ND';
      entry.labels.add(resistance);
    })

    const labels: string[] = []
    const parents: string[] = []
    const values: number[] = []
    const text: string[] = []

    const totalFilteredVolume = totalVolume.value

    Object.entries(data).forEach(([nom, info]) => {
      labels.push(nom)
      parents.push("")
      values.push(info.volume)
      const percentage = totalFilteredVolume > 0 ? ((info.volume / totalFilteredVolume) * 100).toFixed(0) : 0
      text.push(`${info.volume.toLocaleString()} m³<br>${percentage}%`)
    })

    return [{
      type: "treemap",
      labels,
      parents,
      values,
      text,
      textinfo: "label+text",
      marker: {
        colorscale: 'Greens',
        reversescale: true
      },
      hoverinfo: "label+value+percent parent"
    }]
  })

  const formulaViolinData = computed(() => {
    // Agrupar por nomenclatura para el gráfico de violín/puntos
    const groups: Record<string, number[]> = {}
    
    filteredSales.value.forEach(sale => {
      // Solo mostrar nomenclaturas que empiecen por HA o HAF
      if (sale.nomenclatura.startsWith('HA') || sale.nomenclatura.startsWith('HAF')) {
        if (!groups[sale.nomenclatura]) {
          groups[sale.nomenclatura] = [];
        }
        groups[sale.nomenclatura]!.push(sale.contenidoCementoReal);
      }
    })

    const sortedEntries = Object.entries(groups).sort((a, b) => a[0].localeCompare(b[0]));
    const greenPalette = twColors['chart-greens'];

    return sortedEntries.map(([nom, values], index) => {
      const color = greenPalette[index % greenPalette.length] || twColors['primary-green'];
      return {
        type: 'violin',
        y: values,
        name: nom,
        box: { visible: true },
        meanline: { visible: true },
        points: 'all',
        jitter: 0.5,
        marker: { size: 2, color: color },
        line: { color: color }
      }
    })
  })

  // --- Análisis de Transporte ---

  const volumeByTransportista = computed(() => {
    const data: Record<string, { volume: number; trips: number; trucks: Set<string> }> = {};
    
    filteredSales.value.forEach(sale => {
      if (!data[sale.nombreTransportista]) {
        data[sale.nombreTransportista] = { volume: 0, trips: 0, trucks: new Set() };
      }
      const entry = data[sale.nombreTransportista]!;
      entry.volume += sale.cantidad;
      entry.trips += 1;
      entry.trucks.add(sale.matricula);
    });
    
    // Devolver ordenado de mayor a menor con estadísticas calculadas
    return Object.entries(data)
      .sort(([, a], [, b]) => b.volume - a.volume)
      .reduce((acc: Record<string, any>, [k, v]) => {
        acc[k] = {
          volume: v.volume,
          trips: v.trips,
          avgVolume: v.volume / v.trips,
          uniqueTrucks: v.trucks.size
        };
        return acc;
      }, {});
  })

  const volumeByMatricula = computed(() => {
    const data: Record<string, { volume: number; trips: number }> = {};
    
    filteredSales.value.forEach(sale => {
      if (!data[sale.matricula]) {
        data[sale.matricula] = { volume: 0, trips: 0 };
      }
      const entry = data[sale.matricula]!;
      entry.volume += sale.cantidad;
      entry.trips += 1;
    });
    
    // Devolver ordenado de mayor a menor
    return Object.entries(data)
      .sort(([, a], [, b]) => b.volume - a.volume)
      .reduce((acc: Record<string, any>, [k, v]) => {
        acc[k] = {
          volume: v.volume,
          trips: v.trips,
          avgVolume: v.volume / v.trips
        };
        return acc;
      }, {});
  })

  const topTransportista = computed(() => {
    const entries = Object.entries(volumeByTransportista.value);
    if (entries.length === 0) return null;
    return { name: entries[0]![0], volume: (entries[0]![1] as any).volume };
  })

  const topTruck = computed(() => {
    const entries = Object.entries(volumeByMatricula.value);
    if (entries.length === 0) return null;
    return { matricula: entries[0]![0], volume: (entries[0]![1] as any).volume };
  })

  const transportTreeMapData = computed(() => {
    // Estructura: Map<Transportista, Map<Matricula, Volumen>>
    const hierarchy: Record<string, Record<string, number>> = {};
    const transporterVolumes: Record<string, number> = {};
    
    filteredSales.value.forEach(sale => {
      const transporter = sale.nombreTransportista;
      if (!hierarchy[transporter]) {
        hierarchy[transporter] = {};
        transporterVolumes[transporter] = 0;
      }
      
      const transportHierarchy = hierarchy[transporter]!;
      transportHierarchy[sale.matricula] = (transportHierarchy[sale.matricula] || 0) + sale.cantidad;
      transporterVolumes[transporter] = (transporterVolumes[transporter] || 0) + sale.cantidad;
    });

    const ids: string[] = [];
    const labels: string[] = [];
    const parents: string[] = [];
    const values: number[] = [];
    const text: string[] = [];

    // Nodo Raíz invisible para agrupar todo
    const rootId = "root_transportistas";
    ids.push(rootId);
    labels.push("Transportistas");
    parents.push("");
    values.push(totalVolume.value);
    text.push(`${totalVolume.value.toLocaleString()} m³`);

    // Añadir Transportistas
    Object.entries(transporterVolumes).forEach(([transporter, volume]: [string, number]) => {
      ids.push(transporter);
      labels.push(transporter);
      parents.push(rootId);
      values.push(volume);
      text.push(`${volume.toLocaleString()} m³`);
    });

    // Añadir Matrículas bajo sus Transportistas
    Object.entries(hierarchy).forEach(([transporter, trucks]: [string, Record<string, number>]) => {
      Object.entries(trucks).forEach(([truck, volume]: [string, number]) => {
        const truckId = `${transporter}_${truck}`;
        ids.push(truckId);
        labels.push(truck);
        parents.push(transporter);
        values.push(volume);
        text.push(`${volume.toLocaleString()} m³`);
      });
    });

    return [{
      type: "sunburst",
      ids,
      labels,
      parents,
      values,
      text,
      textinfo: "label+text",
      hoverinfo: "label+value+percent parent",
      branchvalues: "total",
      marker: {
        colorscale: 'Greens',
        reversescale: true,
        line: { width: 2, color: twColors['brand-gray'][0] }
      }
    }];
  })

  // Lógica de Tabla Dinámica (Pivot: Fecha vs Planta)
  const pivotData = computed(() => {
    const plants = Object.keys(volumeByPlanta.value).sort()
    const isoDates = Object.keys(filteredSales.value.reduce((acc: Record<string, boolean>, s) => {
      acc[s.fecha] = true
      return acc
    }, {})).sort()
    
    // Mapa de datos: [fecha_iso][planta] = volumen
    const dataMap = filteredSales.value.reduce((acc: Record<string, Record<string, number>>, sale) => {
      const date = sale.fecha
      if (!acc[date]) acc[date] = {}
      acc[date][sale.planta] = (acc[date][sale.planta] || 0) + sale.cantidad
      return acc
    }, {})

    // Generar filas
    const rows = isoDates.map(isoDate => {
      const [y, m, d] = isoDate.split('-')
      const formattedDate = `${d}/${m}/${y}`
      
      const row: Record<string, any> = { date: formattedDate }
      let rowTotal = 0
      
      plants.forEach(plant => {
        const value = dataMap[isoDate]?.[plant] || 0
        row[plant] = value
        rowTotal += value
      })
      
      row.total = rowTotal
      return row
    })

    // Totales por Planta (Fila final)
    const plantTotals: Record<string, number> = {}
    let grandTotal = 0
    plants.forEach(plant => {
      const total = rows.reduce((acc, row) => acc + (row[plant] || 0), 0)
      plantTotals[plant] = total
      grandTotal += total
    })

    return {
      columns: plants,
      rows,
      plantTotals,
      grandTotal
    }
  })

  // --- Análisis de Clientes ---

  const uniqueClientsCount = computed(() => {
    return new Set(filteredSales.value.map(s => s.cliente)).size
  })

  const volumeByCustomer = computed(() => {
    const data: Record<string, { volume: number; name: string }> = {}
    
    filteredSales.value.forEach(sale => {
      if (!data[sale.cliente]) {
        data[sale.cliente] = { volume: 0, name: sale.nombreCliente }
      }
      data[sale.cliente]!.volume += sale.cantidad
    })

    return Object.entries(data)
      .sort(([, a], [, b]) => b.volume - a.volume)
  })

  const topClient = computed(() => {
    const sorted = volumeByCustomer.value
    if (sorted.length === 0) return { nif: '', name: '', volume: 0 }
    return { 
      nif: sorted[0]![0], 
      name: sorted[0]![1].name, 
      volume: sorted[0]![1].volume 
    }
  })

  const top3ClientsInfo = computed(() => {
    const top3 = volumeByCustomer.value.slice(0, 3)
    return {
      volume: top3.reduce((acc, [, info]) => acc + info.volume, 0),
      names: top3.map(([, info]) => info.name).join('\n')
    }
  })

  const top10ClientsInfo = computed(() => {
    const top10 = volumeByCustomer.value.slice(0, 10)
    return {
      volume: top10.reduce((acc, [, info]) => acc + info.volume, 0),
      names: top10.map(([, info]) => info.name).join('\n'),
      count: top10.length
    }
  })

  const concentrationData = computed(() => {
    const sorted = volumeByCustomer.value
    const top10Vol = sorted.slice(0, 10).reduce((acc, [, info]) => acc + info.volume, 0)
    const totalVol = totalVolume.value
    const othersVol = Math.max(0, totalVol - top10Vol)

    return {
      labels: ['Top 10 Clientes', 'Resto de Cartera'],
      values: [top10Vol, othersVol]
    }
  })

  const customerLoyaltyData = computed(() => {
    const data: Record<string, { volume: number; trips: number; name: string; firstDate: string; lastDate: string }> = {}
    
    filteredSales.value.forEach(sale => {
      if (!data[sale.cliente]) {
        data[sale.cliente] = { 
          volume: 0, 
          trips: 0, 
          name: sale.nombreCliente,
          firstDate: sale.fecha,
          lastDate: sale.fecha
        }
      }
      const entry = data[sale.cliente]!
      entry.volume += sale.cantidad
      entry.trips += 1
      
      if (sale.fecha < entry.firstDate) entry.firstDate = sale.fecha
      if (sale.fecha > entry.lastDate) entry.lastDate = sale.fecha
    })

    return Object.entries(data).map(([nif, info]) => ({
      nif,
      name: info.name,
      volume: info.volume,
      frequency: info.trips,
      average: info.volume / info.trips,
      firstPurchase: info.firstDate,
      lastPurchase: info.lastDate
    }))
  })

  const plantPerformanceData = computed(() => {
    const data: Record<string, { 
      volume: number; 
      count: number; 
      firstDate: string; 
      lastDate: string;
      comunidad: string;
    }> = {}
    
    filteredSales.value.forEach(sale => {
      if (!data[sale.planta]) {
        data[sale.planta] = { 
          volume: 0, 
          count: 0, 
          firstDate: sale.fecha, 
          lastDate: sale.fecha,
          comunidad: sale.comunidad
        }
      }
      const info = data[sale.planta]
      if (info) {
        info.volume += sale.cantidad
        info.count += 1
        if (sale.fecha < info.firstDate) info.firstDate = sale.fecha
        if (sale.fecha > info.lastDate) info.lastDate = sale.fecha
      }
    })

    return Object.entries(data).map(([name, info]) => ({
      name,
      comunidad: info.comunidad,
      volume: info.volume,
      frequency: info.count,
      average: info.volume / info.count,
      firstPurchase: info.firstDate,
      lastPurchase: info.lastDate
    })).sort((a, b) => b.volume - a.volume)
  })

  const technicalHeatmapData = computed(() => {
    const data: Record<string, number[]> = {} // weekLabel -> [mon, tue, wed, thu, fri, sat, sun]
    
    filteredSales.value.forEach(sale => {
      const date = new Date(sale.fecha)
      const day = (date.getDay() + 6) % 7 // Lunes = 0, Domingo = 6
      
      // Cálculo de semana ISO simplificado para el label
      const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
      d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7))
      const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
      const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
      const weekLabel = `Sem. ${weekNo} (${d.getUTCFullYear()})`

      if (!data[weekLabel]) {
        data[weekLabel] = [0, 0, 0, 0, 0, 0, 0]
      }
      const weekArray = data[weekLabel]
      if (weekArray && day !== undefined) {
        weekArray[day] = (weekArray[day] ?? 0) + sale.cantidad
      }
    })

    // Ordenar semanas cronológicamente
    const weeks = Object.keys(data).sort((a, b) => {
      const matchA = a.match(/Sem\. (\d+) \((\d+)\)/)
      const matchB = b.match(/Sem\. (\d+) \((\d+)\)/)
      
      if (matchA && matchB) {
        const yearA = parseInt(matchA[2] || '0')
        const yearB = parseInt(matchB[2] || '0')
        if (yearA !== yearB) return yearA - yearB
        
        const weekA = parseInt(matchA[1] || '0')
        const weekB = parseInt(matchB[1] || '0')
        return weekA - weekB
      }
      return a.localeCompare(b)
    })

    const zMatrix = weeks.map(w => data[w])
    
    return {
      x: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'],
      y: weeks,
      z: zMatrix
    }
  })

  const technicalKPIs = computed(() => {
    const sales = filteredSales.value
    if (sales.length === 0) return { 
      avgPerTrip: 0, 
      totalArticles: 0, 
      topArticle: '---', 
      bestPlant: '---',
      maxTimeToSite: 0,
      maxUnloadingTime: 0,
      lateUnloadingsCount: 0
    }

    const articles: Record<string, number> = {}
    const plants: Record<string, number> = {}
    let maxTimeToSite = 0
    let maxUnloadingTime = 0
    let lateUnloadingsCount = 0
    
    sales.forEach(s => {
      articles[s.articulo] = (articles[s.articulo] || 0) + s.cantidad
      plants[s.planta] = (plants[s.planta] || 0) + s.cantidad
      
      if (s.tiempoViaje && s.tiempoViaje > maxTimeToSite) {
        maxTimeToSite = s.tiempoViaje
      }
      if (s.tiempoDescarga && s.tiempoDescarga > maxUnloadingTime) {
        maxUnloadingTime = s.tiempoDescarga
      }
      if (s.descargaTardia) {
        lateUnloadingsCount++
      }
    })

    const topArticleEntry = Object.entries(articles).sort((a, b) => b[1] - a[1])[0]
    const bestPlantEntry = Object.entries(plants).sort((a, b) => b[1] - a[1])[0]

    return {
      avgPerTrip: totalVolume.value / sales.length,
      totalArticles: Object.keys(articles).length,
      topArticle: topArticleEntry ? topArticleEntry[0] : '---',
      bestPlant: bestPlantEntry ? bestPlantEntry[0] : '---',
      maxTimeToSite,
      maxUnloadingTime,
      lateUnloadingsCount
    }
  })

  const technicalKPIsByPlant = computed(() => {
    const data: Record<string, { 
      maxTimeToSite: number; 
      maxUnloadingTime: number; 
      lateUnloadings: number;
    }> = {}
    
    filteredSales.value.forEach(sale => {
      if (!data[sale.planta]) {
        data[sale.planta] = { maxTimeToSite: 0, maxUnloadingTime: 0, lateUnloadings: 0 }
      }
      const plantData = data[sale.planta]!
      
      if (sale.tiempoViaje && sale.tiempoViaje > plantData.maxTimeToSite) {
        plantData.maxTimeToSite = sale.tiempoViaje
      }
      if (sale.tiempoDescarga && sale.tiempoDescarga > plantData.maxUnloadingTime) {
        plantData.maxUnloadingTime = sale.tiempoDescarga
      }
      if (sale.descargaTardia) {
        plantData.lateUnloadings++
      }
    })

    return Object.entries(data).map(([name, info]) => ({
      name,
      ...info
    }))
  })

  function setSales(sales: Sale[]) {
    rawSales.value = sales
  }

  function setFilters(newFilters: Partial<SalesFilters>) {
    filters.value = { ...filters.value, ...newFilters }
  }

  function removeFilterValue(key: keyof SalesFilters, value: string) {
    const current = filters.value[key]
    if (Array.isArray(current)) {
      filters.value[key] = current.filter(v => v !== value) as any
    }
  }

  return {
    rawSales,
    filters,
    filteredSales,
    totalVolume,
    prevTotalVolume,
    volumeVariation,
    volumeByPlanta,
    volumeByCommunity,
    communityPlotlyData,
    salesByDay,
    salesByMonth,
    maxSalesDay,
    selfConsumptionVolume,
    averageVolumeByPlanta,
    averageSalesByDay,
    averageSalesByMonth,
    uniqueNomenclaturesCount,
    averageCementContent,
    formulaTreemapData,
    formulaViolinData,
    volumeByTransportista,
    volumeByMatricula,
    topTransportista,
    topTruck,
    transportTreeMapData,
    uniqueClientsCount,
    volumeByCustomer,
    topClient,
    top3ClientsInfo,
    top10ClientsInfo,
    concentrationData,
    customerLoyaltyData,
    plantPerformanceData,
    technicalHeatmapData,
    technicalKPIs,
    technicalKPIsByPlant,
    pivotData,
    filterOptions,
    isLoading,
    fileError,
    setSales,
    setFilters,
    removeFilterValue,
    setFileError(error: string | null) {
      fileError.value = error
    }
  }
})
