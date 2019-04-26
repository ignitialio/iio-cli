import './app.css'
import 'typeface-roboto'
import 'material-design-icons/iconfont/material-icons.css'

import Vue from 'vue'
import {sync} from 'vuex-router-sync'

import App from './components/App.vue'
import {getRouter} from '@ignitial/iio-app-client'
import {getStore} from '@ignitial/iio-app-client'

// Vue plugins
import {wsPlugin} from '@ignitial/iio-app-client'
import {servicesPlugin} from '@ignitial/iio-app-client'
import {modulesPlugin} from '@ignitial/iio-app-client'
import {i18nPlugin} from '@ignitial/iio-app-client'
import {utilsPlugin} from '@ignitial/iio-app-client'
import {syncdbPlugin} from '@ignitial/iio-app-client'

// in some way is a plugin
import * as d3 from 'd3'

// Vuetify
import Vuetify from 'vuetify'
import 'vuetify/dist/vuetify.min.css'

// File upload
import vue2Dropzone from 'vue2-dropzone'
import 'vue2-dropzone/dist/vue2Dropzone.min.css'

// recursive components
import {JSONFormItem} from '@ignitial/iio-app-client'
import {SchemaTreeItem} from '@ignitial/iio-app-client'
import {JSONViewer} from '@ignitial/iio-app-client'
// other components
import {JSONForm} from '@ignitial/iio-app-client'
import {FileDrop} from '@ignitial/iio-app-client'
import {ColorPicker} from '@ignitial/iio-app-client'
import {Geo} from '@ignitial/iio-app-client'

// -----------------------------------------------------------------------------
// Specific imports

import myServicePlugin from './plugins/myservice'

import Dashboard from './views/Dashboard.vue'
// -----------------------------------------------------------------------------

// Vue configuration
Vue.config.productionTip = false

// get instances
let router = getRouter(Vue)
let store = getStore(Vue)

// -----------------------------------------------------------------------------
// Specific routes
router.addRoutes([
  {
    path: '/',
    name: 'rootPath',
    component: Dashboard,
    beforeEnter: (to, from, next) => {
      let token = localStorage.getItem('token')
      if (token && token !== 'null') {
        next()
      } else {
        next({ path: '/login' })
      }
    }
  }
])
// -----------------------------------------------------------------------------
// Specific store
store.registerModule('toto', {
  state: {
    myState: null
  },
  mutations: {
    myState(state, value) {
      state.myState = value
    }
  }
})
// -----------------------------------------------------------------------------

// router sync
sync(store, router)

// Vue plugins use
Vue.use(Vuetify)
Vue.use(wsPlugin)
Vue.use(servicesPlugin)
Vue.use(utilsPlugin)
Vue.use(modulesPlugin)
Vue.use(i18nPlugin)
Vue.use(syncdbPlugin)

// -----------------------------------------------------------------------------
// Specific plugins
Vue.use(myServicePlugin)
// -----------------------------------------------------------------------------

// make Vue available for services
global.Vue = Vue

// inject d3 as used very often
Vue.prototype.$d3 = d3

// create app
const app = new Vue({
  router,
  store,
  ...App
})

// initialize modules
app.$modules.initialize()

// File upload
Vue.component('file-uploader', vue2Dropzone)

// recursive components
Vue.component('json-form-item', JSONFormItem)
Vue.component('schematree-item', SchemaTreeItem)
Vue.component('jsonviewer', JSONViewer)
// other components
Vue.component('json-form', JSONForm)
Vue.component('file-drop', FileDrop)
Vue.component('colorpicker', ColorPicker)
Vue.component('geo', Geo)

// on service up (unified services)
app.$services.$on('service:up', service => {
  if (!service) {
    console.log('something weird there when service up')
    return
  }

  switch (service.name) {
    case 'auth':
      if (app.$store.state.user) {
        app.$services.auth.authenticate({
          username: app.$store.state.user.username,
          token: localStorage.token
        }).then(() => {
          console.log('authenticated')
          app.$ws.socket._logged = true
          app.$services.$emit('app:login')
        }).catch(err => {
          console.log('authentication failed', err)
          // app.$ws.resetLocalCredentials()
          // app.$router.push('/login')
          app.$services.$emit('app:logout')
        })
      }
      break
    default:
  }
})

// manage splashscreen/progress
app.$d3.select('#splashscreen').style('opacity', 0)
app.$d3.select('#progress').style('opacity', 0)

setTimeout(() => {
  app.$d3.select('#splashscreen').remove()
  app.$d3.select('#progress').remove()
}, 1000)

export {app, router, store}
