import { createApp } from 'vue'
import { createPinia } from 'pinia'
import PrimeVue from 'primevue/config'
import ToastService from 'primevue/toastservice'
// @ts-ignore
import Aura from '@primevue/themes/aura'
import { definePreset } from '@primevue/themes'
// @ts-ignore
import tailwindConfig from '../tailwind.config.js'
import Tooltip from 'primevue/tooltip'
import './assets/index.css'

const twColors = tailwindConfig.theme.extend.colors;
const brandGray = twColors['brand-gray'];
const surfaceDark = twColors['surface-dark'];

const MyPreset = definePreset(Aura, {
    semantic: {
        primary: {
            50: twColors['lighter-pale-green'],
            100: twColors['lighter-pale-green'],
            200: twColors['pale-green'],
            300: twColors['pale-green'],
            400: twColors['medium-dark-green'],
            500: twColors['primary-green'],
            600: twColors['darker-green'],
            700: twColors['darker-green'],
            800: twColors['darker-green'],
            900: twColors['darker-green'],
            950: twColors['darker-green']
        },
        colorScheme: {
            light: {
                surface: {
                    0: brandGray[0],
                    50: brandGray[50],
                    100: brandGray[100],
                    200: brandGray[200],
                    300: brandGray[300],
                    400: brandGray[400],
                    500: brandGray[500],
                    600: brandGray[600],
                    700: brandGray[700],
                    800: brandGray[800],
                    900: brandGray[900],
                    950: brandGray[950]
                },
                primary: {
                    color: twColors['primary-green'],
                    inverseColor: brandGray[0],
                    hoverColor: twColors['darker-green'],
                    activeColor: twColors['darker-green']
                }
            },
            dark: {
                surface: {
                    0: surfaceDark[0],
                    50: surfaceDark[50],
                    100: surfaceDark[100],
                    200: surfaceDark[200],
                    300: surfaceDark[300],
                    400: surfaceDark[400],
                    500: surfaceDark[500],
                    600: surfaceDark[600],
                    700: surfaceDark[700],
                    800: surfaceDark[800],
                    900: surfaceDark[900],
                    950: surfaceDark[950]
                },
                primary: {
                    color: twColors['pale-green'],
                    inverseColor: surfaceDark[0],
                    hoverColor: twColors['lighter-pale-green'],
                    activeColor: twColors['medium-dark-green']
                }
            }
        }
    }
});

import 'primeicons/primeicons.css'
import App from './App.vue'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(ToastService)
app.use(PrimeVue, {
    theme: {
        preset: MyPreset,
        options: {
            prefix: 'p',
            darkModeSelector: '.app-dark',
            cssLayer: false
        }
    },
    locale: {
        firstDayOfWeek: 1,
        dayNames: ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"],
        dayNamesShort: ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"],
        dayNamesMin: ["D", "L", "M", "X", "J", "V", "S"],
        monthNames: ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"],
        monthNamesShort: ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"],
        today: 'Hoy',
        clear: 'Limpiar'
    }
})
app.directive('tooltip', Tooltip)

app.mount('#app')
