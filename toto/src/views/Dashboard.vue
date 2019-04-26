<template>
  <transition name="fade">
    <div v-if="ready" class="dashboard-layout">
      <geo></geo>
    </div>
  </transition>
</template>

<script>
export default {
  data() {
    return {
      ready: false
    }
  },
  watch: {},
  components: {
  },
  computed: {},
  methods: {},
  mounted() {
    // toolbar section name display
    this.$store.commit('section', this.$i18n.$t('Dashboard'))
    this.ready = true

    // wait for login
    this.$services.waitForProperty(this.$ws.socket, '_logged').then(async () => {
      let myunified = await this.$services.waitForService('myunified')
      let result = await myunified.myServiceMethod()
      console.log('service method result= ', result)
      let myaddon = await this.$modules.waitForService('myaddon')
      result = await myaddon.myAddOnMethod()
      console.log('module method result= ', result)

      // check service access
      result = await myunified.myProtectedServiceMethod()
    }).catch(err => console.log(err))
  },
  beforeDestroy() {

  }
}
</script>

<style>
.dashboard-layout {
  width: 100%;
  height: 100%;
}
</style>
