import {getStore} from '@ignitial/iio-app-client'

var myServicePlugin = {
  install:
    function (Vue) {
      class MyService extends Vue {
        constructor() {
          super()
          this.$store = getStore(Vue)

          this.uuid = Math.random().toString(36).slice(2)
        }

        initialize() {}
      }

      Vue.prototype.$myplugin = new MyService()
    }
}

export default myServicePlugin
