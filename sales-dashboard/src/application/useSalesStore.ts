import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Sale, SalesFilters } from '../core/entities/Sale'

export const useSalesStore = defineStore('sales', () => {
  const rawSales = ref<Sale[]>([])
  const isLoading = ref(false)
  
  const filters = ref<SalesFilters>({
    startDate: null,
    endDate: null,
    fabrica: null,
    fabricaPrefix: null,
    grupo: null,
    truck: null,
    transportista: null
  })

  const filteredSales = computed(() => {
    return rawSales.value.filter(sale => {
      if (filters.value.startDate && sale.fecha < filters.value.startDate) return false
      if (filters.value.endDate && sale.fecha > filters.value.endDate) return false
      if (filters.value.fabrica && sale.planta !== filters.value.fabrica) return false
      if (filters.value.fabricaPrefix && sale.comunidad !== filters.value.fabricaPrefix) return false
      if (filters.value.grupo && sale.grupo !== filters.value.grupo) return false
      if (filters.value.truck && sale.matricula !== filters.value.truck) return false
      if (filters.value.transportista && sale.nombreTransportista !== filters.value.transportista) return false
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
      if (filters.value.fabrica && sale.planta !== filters.value.fabrica) return false
      if (filters.value.fabricaPrefix && sale.comunidad !== filters.value.fabricaPrefix) return false
      if (filters.value.grupo && sale.grupo !== filters.value.grupo) return false
      if (filters.value.truck && sale.matricula !== filters.value.truck) return false
      if (filters.value.transportista && sale.nombreTransportista !== filters.value.transportista) return false
      return true
    })
  })

  const totalVolume = computed(() => {
    return filteredSales.value.reduce((acc, sale) => acc + sale.cantidad, 0)
  })

  const prevTotalVolume = computed(() => {
    return prevPeriodSales.value.reduce((acc, sale) => acc + sale.cantidad, 0)
  })

  const volumeVariation = computed(() => {
    if (prevTotalVolume.value === 0) return 0
    return ((totalVolume.value - prevTotalVolume.value) / prevTotalVolume.value) * 100
  })

  const volumeByPlanta = computed(() => {
    return filteredSales.value.reduce((acc: Record<string, number>, sale) => {
      acc[sale.planta] = (acc[sale.planta] || 0) + sale.cantidad
      return acc
    }, {})
  })

  const volumeByCommunity = computed(() => {
    return filteredSales.value.reduce((acc: Record<string, number>, sale) => {
      acc[sale.comunidad] = (acc[sale.comunidad] || 0) + sale.cantidad
      return acc
    }, {})
  })

  const salesByDay = computed(() => {
    const data = filteredSales.value.reduce((acc: Record<string, number>, sale) => {
      const d = sale.fecha // Ya es YYYY-MM-DD
      acc[d] = (acc[d] || 0) + sale.cantidad
      return acc
    }, {})
    
    const sortedKeys = Object.keys(data).sort()
    return {
      labels: sortedKeys.map(k => {
        const [y, m, d] = k.split('-')
        return `${d}/${m}/${y}`
      }),
      values: sortedKeys.map(k => data[k] ?? 0)
    }
  })

  const salesByMonth = computed(() => {
    const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
    const data = filteredSales.value.reduce((acc: Record<string, number>, sale) => {
      const date = new Date(sale.fecha)
      const key = `${months[date.getMonth()]} ${date.getFullYear()}`
      acc[key] = (acc[key] || 0) + sale.cantidad
      return acc
    }, {})

    const sortedEntries = Object.entries(data).sort((a, b) => {
      const partsA = a[0].split(' ')
      const partsB = b[0].split(' ')
      const mA = partsA[0] || ''
      const yA = partsA[1] || '0'
      const mB = partsB[0] || ''
      const yB = partsB[1] || '0'
      
      const dateA = new Date(parseInt(yA), months.indexOf(mA))
      const dateB = new Date(parseInt(yB), months.indexOf(mB))
      return dateA.getTime() - dateB.getTime()
    })

    return {
      labels: sortedEntries.map(e => e[0]),
      values: sortedEntries.map(e => e[1])
    }
  })

  // Nuevos KPIs de Negocio
  const maxSalesDay = computed(() => {
    const data = filteredSales.value.reduce((acc: Record<string, number>, sale) => {
      acc[sale.fecha] = (acc[sale.fecha] || 0) + sale.cantidad
      return acc
    }, {})
    
    let maxDate = ''
    let maxValue = 0
    
    Object.entries(data).forEach(([date, value]) => {
      if (value > maxValue) {
        maxValue = value
        maxDate = date
      }
    })

    if (!maxDate) return null
    
    const [y, m, d] = maxDate.split('-')
    return {
      date: `${d}/${m}/${y}`,
      value: maxValue
    }
  })

  const selfConsumptionVolume = computed(() => {
    return filteredSales.value
      .filter(sale => sale.nombreCliente.includes('GENERAL DE HORMIGONES, S.A.'))
      .reduce((acc, sale) => acc + sale.cantidad, 0)
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
    return values.reduce((a, b) => a + b, 0) / values.length
  })

  const averageSalesByMonth = computed(() => {
    const values = salesByMonth.value.values
    if (values.length === 0) return 0
    return values.reduce((a, b) => a + b, 0) / values.length
  })

  // --- Análisis de Fórmulas ---
  
  const uniqueNomenclaturesCount = computed(() => {
    const nomenclatures = new Set(filteredSales.value.map(s => s.nomenclatura))
    return nomenclatures.size
  })

  const averageCementContent = computed(() => {
    if (filteredSales.value.length === 0) return 0
    const totalCement = filteredSales.value.reduce((acc, s) => acc + (s.contenidoCementoReal || 0), 0)
    return totalCement / filteredSales.value.length
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
      if (!groups[sale.nomenclatura]) {
        groups[sale.nomenclatura] = [];
      }
      groups[sale.nomenclatura]!.push(sale.contenidoCementoReal);
    })

    return Object.entries(groups).map(([nom, values]) => ({
      type: 'violin',
      y: values,
      name: nom,
      box: { visible: true },
      meanline: { visible: true },
      points: 'all',
      jitter: 0.5,
      marker: { size: 2, color: '#1A664B' },
      line: { color: '#004730' }
    }))
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
    // Paleta de colores categórica para transportistas
    const colorPalette = [
      '#636EFA', '#EF553B', '#00CC96', '#AB63FA', '#FFA15A', 
      '#19D3F3', '#FF6692', '#B6E880', '#FF97FF', '#FECB52'
    ];

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

    const labels: string[] = [];
    const parents: string[] = [];
    const values: number[] = [];
    const text: string[] = [];
    const colors: string[] = [];

    // Nodo Raíz invisible para agrupar todo
    const rootLabel = "Transportistas";
    labels.push(rootLabel);
    parents.push("");
    values.push(totalVolume.value);
    text.push("");
    colors.push('rgba(0,0,0,0)');

    // Añadir Transportistas
    Object.entries(transporterVolumes).forEach(([transporter, volume], index) => {
      labels.push(transporter);
      parents.push(rootLabel);
      values.push(volume);
      text.push(`<b>${transporter}</b><br>${volume.toLocaleString()} m³`);
      // Asignar color de la paleta
      colors.push(colorPalette[index % colorPalette.length] || '#888');
    });

    // Añadir Matrículas bajo sus Transportistas
    Object.entries(hierarchy).forEach(([transporter, trucks], tIndex) => {
      const parentColor = colorPalette[tIndex % colorPalette.length] || '#888';
      Object.entries(trucks).forEach(([truck, volume]) => {
        // ID único para evitar colisiones
        const truckId = `${transporter} - ${truck}`;
        labels.push(truckId);
        parents.push(transporter);
        values.push(volume);
        // Texto más limpio para matrículas
        text.push(`${truck}<br>${volume.toLocaleString()} m³`);
        // Las matrículas heredan el color del padre pero con cierta opacidad o ligero ajuste si se desea
        // En Plotly, si no se especifica color por nodo, los hijos pueden heredar o comportarse según la escala
        colors.push(parentColor);
      });
    });

    return [{
      type: "treemap",
      labels,
      parents,
      values,
      text,
      textinfo: "label+text",
      hoverinfo: "label+value+percent parent",
      branchvalues: "total",
      marker: {
        colors: colors,
        line: { width: 2, color: 'white' },
        pad: { b: 5, l: 5, r: 5, t: 25 }
      },
      pathbar: { visible: true, thickness: 30, textfont: { size: 14 } },
      tiling: { packing: 'squarify', pad: 4 }
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

  function setSales(sales: Sale[]) {
    rawSales.value = sales
  }

  function setFilters(newFilters: Partial<SalesFilters>) {
    filters.value = { ...filters.value, ...newFilters }
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
    pivotData,
    isLoading,
    setSales,
    setFilters
  }
})
