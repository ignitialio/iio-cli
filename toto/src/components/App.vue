<template>
  <v-app class="app" :dark="darkTheme">

    <!-- Search box -->
    <div v-if="logged && showSearch" class="app-search">
      <div @click="searchExtended = !searchExtended"
        class="app-search-handle elevation-2 no-text-selection">
        <v-icon>search</v-icon></div>
      <v-text-field v-if="searchExtended" solo clearable single-line
        :label="$t('Search')" @change="handleSearchPattern">
      </v-text-field>
    </div>

    <v-toolbar class="app-toolbar"
      :flat="flatToolbar" dense
      :color="toolbarColor">

      <!-- App tool bar icon: overwrite app-logo background to change -->
      <v-toolbar-side-icon v-if="logged"
        @click.stop="toggleLeftSidenav">
        <img class="app-logo" src="assets/toto-32.png"/>
      </v-toolbar-side-icon>

      <!-- Secondary logo like company one for example -->
      <div v-if="logged" class="app-logo-secondary"></div>

      <!-- Show where we are - app section -->
      <div class="app-section"
        v-if="logged && $store.state.showSection && $store.state.section">
        {{ $t($store.state.section) }}</div>

      <v-spacer></v-spacer>

      <div v-if="!logged" style="width: 100%" class="ig-centered">
        <img v-show="connected" class="app-logo" src="assets/toto-32.png"/>

        <v-progress-circular v-show="!offline && !connected"
          indeterminate :size="20" :width="1" color="primary">
        </v-progress-circular>

        <v-icon v-show="offline && !connected"
          color="red">cloud_off</v-icon>
      </div>

      <div v-if="logged" class="app-context-buttons">
        <v-btn flat icon v-for="b in contextButtons" :key="b.name"
          @click="b.on = !b.on; b.handleClick(b)">
          <v-icon v-if="b.on">{{ b.iconOn }}</v-icon>
          <v-icon v-if="!b.on">{{ b.iconOff }}</v-icon>
        </v-btn>
      </div>

      <div v-if="logged && user" class="ig-clickable app-avatar-small"
        @click="showNotifications = !showNotifications">
        <v-badge overlap color="rgba(205, 133, 63, 0.8)">
          <span slot="badge" v-if="userNotifications.length > 0">
            {{ userNotifications ? userNotifications.length : 0 }}</span>

          <v-avatar :size="32" style="border: 1px solid slategrey!important;">
            <img :src="user.avatar ? user.avatar + '&token='
              + $utils.token() : 'assets/user.png'" alt=""/>
          </v-avatar>
       </v-badge>
      </div>

      <v-progress-circular v-show="!offline && !connected && logged"
        indeterminate :size="20" :width="1" color="primary">
      </v-progress-circular>

      <v-icon v-show="offline && !connected && logged"
        color="red">cloud_off</v-icon>
    </v-toolbar>

    <v-navigation-drawer temporary app
      ref="leftSideNav" v-model="leftSidenav">
      <v-toolbar class="app-sidebar-header" flat>
        <v-list dense class="app-avatar" v-if="logged">
          <v-list-tile avatar
            @click="navTo('/profile')">

            <v-list-tile-avatar>
              <img :src="user.avatar ? user.avatar + '&token='
                + $utils.token() : 'assets/user.png'" alt=""/>
            </v-list-tile-avatar>

            <v-list-tile-content>
              <v-list-tile-title>
                {{ $t(user.firstname + ' ' + user.lastname) }}</v-list-tile-title>

              <v-list-tile-sub-title v-if="user.contactInfo" class="app-user-contact">
                {{ user.contactInfo.email }}</v-list-tile-sub-title>
            </v-list-tile-content>
          </v-list-tile>
        </v-list>
      </v-toolbar>

      <v-list dense>
        <template v-for="(item, index) in menuItems">
          <div style="display: none" :key="index">{{ index }}</div> <!-- lint -->
          <v-subheader v-if="item && item.header" :key="item.header">{{ $t(item.header) }}</v-subheader>
          <v-divider v-if="item.divider" :inset="item.inset" :key="item.inset"></v-divider>

          <v-list-tile :key="item.title"
            v-if="item.title && !item.hideIfLogged && (item.anonymousAccess || !!logged)"
            @click="item.handler ? handleMenuItem(item.handler) :
              navTo(item.path)">
              <v-list-tile-action class="app-menu-item-icon">
                <v-icon v-if="!item.svgIcon">{{ item.icon }}</v-icon>
                <img v-if="item.svgIcon" class="ig-menu-icon" :src="item.svgIcon" alt=""/>
              </v-list-tile-action>

              <v-list-tile-content>
                <v-list-tile-title
                  :class="{ 'app-menu-item-selected':
                    $store.state.route.path === item.path }">
                  {{ $t(item.title) }}</v-list-tile-title>
              </v-list-tile-content>
          </v-list-tile>
        </template>
      </v-list>

      <v-list dense>
        <v-divider></v-divider>
        <v-subheader>{{ $t('Version') }}</v-subheader>

        <v-list-tile v-if="packageInfo" @click="navTo('/admin')">
          <v-list-tile-action>
            <img style="width: 24px; height: 24px;"
              src="assets/toto-32.png" alt=""/>
          </v-list-tile-action>
          <v-list-tile-content>
            {{ packageInfo.name }} v{{ packageInfo.version }}
          </v-list-tile-content>
        </v-list-tile>

        <v-list-tile v-if="dataInfo">
          <v-list-tile-action>
            <v-icon>toll</v-icon>
          </v-list-tile-action>
          <v-list-tile-content>
            version {{ dataInfo.value }} rev {{ dataInfo.rev }}
          </v-list-tile-content>
        </v-list-tile>
      </v-list>
    </v-navigation-drawer>

    <v-content class="app-view">
      <transition name="fade">
        <router-view class="app-router"></router-view>
      </transition>

      <v-snackbar v-model="notificationSnack"
        :timeout="5000">
      {{ notification }}
      </v-snackbar>

      <!-- Confirm dialog -->
      <v-dialog v-model="confirmDialog" max-width="500px"
        @close="handleConfirmClose">
        <v-card>
          <v-card-title>
            <div v-if="confirmationPrompt !== null">
              {{ confirmationPrompt }}
            </div>
          </v-card-title>

          <v-card-text>
          </v-card-text>

          <v-card-actions>
            <v-btn color="primary" flat
              @click="handleConfirm('ok')">
              {{ $t('Apply') }}
            </v-btn>

            <v-btn color="error" flat
              @click="handleConfirm('cancel')">
              {{ $t('Cancel') }}
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <v-bottom-sheet v-model="showNotifications">
        <v-list>
          <v-subheader>{{ $t('Notifications') }}</v-subheader>
          <v-list-tile
            v-for="notification in userNotifications" :key="notification._id"
            @click="ackNotification(notification)">

            <v-list-tile-avatar>
              <img :src="notification.image" alt=""/>
            </v-list-tile-avatar>

            <v-list-tile-title>
              <span>{{ notification.message }}</span>
              <span class="app-notification-date">
                {{ $utils.fromNow(notification._lastModified) }}</span>
            </v-list-tile-title>
          </v-list-tile>
        </v-list>
      </v-bottom-sheet>
    </v-content>
  </v-app>
</template>

<script>
import * as d3 from 'd3'
import colors from 'vuetify/es5/util/colors'

export default {
  data: () => {
    return {
      notification: '',
      contextButtons: [],
      userNotifications: [],
      lastNotification: null,
      showNotifications: false,
      showSearch: false,
      searchExtended: true,
      filter: '',
      packageInfo: {},
      dataInfo: {},
      leftSidenav: false,
      notificationSnack: false,
      confirmDialog: false,
      confirmationPrompt: null,
      menuItems: []
    }
  },
  methods: {
    handleSearchPattern(pattern) {
      this.$services.$emit('app:search:pattern', pattern)
    },
    handleConfirmClose() {
      this.$services.$emit('app:confirmation:response', 'cancel')
    },
    handleConfirm(what) {
      if (this.confirmDialog) {
        this.confirmDialog = false

        this.$services.$emit('app:confirmation:response', what)
      }
    },
    handleMenuItem(handler) {
      this[handler]()
    },
    /*
      Shows Snack (app) notification (used from any where with this.$root)
    */
    showAppNotification(msg) {
      this.notification = msg
      this.notificationSnack = true
    },
    /*
      Updates user (!= app notification) notifications
    */
    _myNotifications() {
      this.$services.waitForProperty(this.$ws.socket, '_logged').then(_logged => {
        this.$modules.waitForService('data', 'notifications').then(notifications => {
          notifications.obtainMine().then(docs => {
            this.userNotifications = []
            for (let notification of docs) {
              if (notification.status === 'noack') {
                this.userNotifications.push(notification)
              }
            }
            // console.log('user notifications', this.userNotifications.length)
            this.$forceUpdate()

            this.lastNotification =
              this.userNotifications[this.userNotifications.length - 1]
          }).catch(err => console.log(err))
        }).catch(err => console.log(err))
      }).catch(err => console.log(err))
    },
    ackNotification(notification) {
      if (notification.status === 'noack') {
        notification.status = 'ack'
        this.$modules.waitForService('data', 'notifications').then(notifications => {
          notifications.put(notification).then().catch(err => console.log(err))
          this.$services.$emit('app:user:notification:update')
        }).catch(err => console.log(err))
      }
    },
    loadConfig() {
      return new Promise(async (resolve, reject) => {
        // rest config
        let cfg
        try {
          await this.$services.waitForProperty(this.$ws.socket, '_logged')
          let config = await this.$services.waitForService('config')
          cfg = await config.get()
        } catch(err) {
          cfg = await this.$utils.getConfig()
        }

        // store cfg for further use
        this.$store.commit('config', cfg)

        // menu
        this.menuItems = cfg.appMenu.items

        // we are connected for sure
        if (!this.$store.state.connected) {
          this.$store.commit('connected', true)
        }

        // theming
        if (cfg.theming) {
          this.$store.commit('flatToolbar', cfg.theming.flatToolbar)
          this.$store.commit('toolbarColor', cfg.theming.toolbarColor)
          this.$store.commit('darkTheme', cfg.theming.darkTheme)

          // update primary color
          if (cfg.theming.darkTheme) {
            this.$vuetify.theme.primary = colors.amber.darken2
            this.$store.commit('toolbarColor', 'transparent')
          } else {
            this.$vuetify.theme.primary = colors.blue.darken2
          }
        }

        resolve(cfg)
      })
    },
    navTo(route) {
      this.toggleLeftSidenav()
      this.$router.push(route)
    },
    toggleLeftSidenav() {
      this.leftSidenav = !this.leftSidenav
    },
    toggleRightSidenav() {
      this.$services.$emit('app:ui:toggleSidenav')
    },
    logout() {
      // BUG: needs removal here since wierd behaviour
      d3.select('.app-context-buttons').selectAll('*').remove()
      //
      if (!this.$store.state.user) {
        console.log('already logged out')
        return
      }

      if (this.$store.state.connected) {
        this.$services.waitForService('auth').then(auth => {
          console.log('signout')
          auth.signout().then(() => {
            this.$modules.waitForService('data').then(data => {
              data.connections.signOutLog().catch(err => console.log(err))

              this.$ws.resetLocalCredentials()
              this.leftSidenav = false
              this.$router.push('/login')
              this.$services.$emit('app:loggedout')
            })
          }).catch(err => {
            console.log('sign out error', err)
          })
        })
      } else if (this.$store.state.config.offline.activated) {
        this.$ws.resetLocalCredentials()
        this.leftSidenav = false
        this.$router.push('/login')
      } else {
        this.$services.$emit('app:notification', this.$t('App is offline. Check your network connection'))
      }
    },
    handleFilterUpdate(e) {
      this.$services.$emit('app:filter', e)
    },
    onLogin() {
      if (this.$store.state.user.lang) {
        this.$i18n.setTranslation(this.$store.state.user.lang)
        this.$i18n.resetTranslation()
        console.log('language has been set to user\'s one', this.$store.state.user.lang)
      }

      if (!this.$store.state.user.theming) {
        let user = _.cloneDeep(this.$store.state.user)
        user.theming = this.$store.state.config.theming
        this.$store.commit('user', user)
      }

      // load user notifications
      this._myNotifications()

      this.$modules.waitForService('data').then(data => {
        data.connections.signInLog().catch(err => console.log(err))
      })

      this.autoLogout()
    },
    autoLogout() {
      this.loadConfig().then(cfg => {
        let idleTime = 1

        // set timer for inactivity logout
        let idleInterval = setInterval(() => {
          idleTime++
          let timeout = cfg.logout ? cfg.logout.timeout : 15
          if (idleTime >= timeout) {
            clearInterval(idleInterval)
            if (this.$store.state.user) this.logout()
          }
        }, 60000)

        // reset on mouse movement or key pressed
        document.addEventListener('mousemove', () => {
          idleTime = 0
        })

        document.addEventListener('keypress', () => {
          idleTime = 0
        })
      }).catch(err => console.log(err))
    }
  },
  mounted() {
    this.$store.commit('connected', true)

    // load config and menu items
    this.loadConfig().catch(err => console.log(err))

    // manage contextual help
    this.$services.$on('app:help:contextual', info => {
      this.contextualHelp = info

      setTimeout(() => {
        this.contextualHelp = null
        this.$refs.helpSnack.close()
      }, 20000)
    })

    // manage external services menu items add and removal
    this.$services.$on('app:sidemenu:item:add', item => {
      for (let i = 0; i < this.servicesMenu.length; i++) {
        if (this.servicesMenu[i].title === item.title) {
          return
        }
      }
      this.servicesMenu.push(item)
    })

    this.$services.$on('app:sidemenu:item:remove', item => {
      for (let i = 0; i < this.servicesMenu.length; i++) {
        if (this.servicesMenu.title === item.title) {
          this.servicesMenu.splice(i, 1)
          console.log('sidemenu item removed')
          break
        }
      }
    })

    // manage app notifications
    this.$services.$on('app:notification', data => {
      this.notification = data
      this.notificationSnack = true
    })

    // manage contextual buttons
    this.$services.$on('app:context:buttons:add', but => {
      this.contextButtons.push(but)
    })

    this.$services.$on('app:context:buttons:clear', () => {
      this.contextButtons = []
    })

    this.$services.$on('app:context:buttons:remove', but => {
      for (let i = 0; i < this.contextButtons.length; i++) {
        if (this.contextButtons[i].name === but.name) {
          this.contextButtons.splice(i, 1)
        }
      }
    })

    // manage clipboard
    this.$services.$on('app:clipboard', data => {
      localStorage.clipboard = JSON.stringify(data)
    })

    // delete notification: internal
    this.$services.$on('app:user:notification:delete', () => {
      this._myNotifications()
    })

    // update notification: internal
    this.$services.$on('app:user:notification:update', () => {
      this._myNotifications()
    })

    // user notification based on notification collection
    this.$ws.socket.on('service:data:event:notification:add', msg => {
      if (msg) {
        this.notification = msg.name
      }

      this._myNotifications()
    })

    // logout detected
    this.$services.$on('app:logout', () => {
      if (this.user) {
        this.$ws.resetLocalCredentials()

        this.$modules.waitForService('data').then(data => {
          data.connections.signOutLog().then(() => {
            this.$services.$emit('app:loggedout')
          }).catch(err => console.log(err))
        })
      }

      this.$router.push('/login')
    })

    // login detected
    this.$services.$on('app:login', this.onLogin.bind(this))

    // confirmation request
    this.$services.$on('app:confirmation:request', prompt => {
      this.confirmationPrompt = prompt
      this.confirmDialog = true
    })

    // watch connection status
    this.$ws.socket.on('disconnect', () => {
      this.$store.commit('connected', false)
      this.$services.$emit('app:disconnected')

      this.$ws.socket.once('connect', () => {
        if (!this.$store.state.connected) this.$services.$emit('app:connected')
        this.$store.commit('connected', true)
      })

      this.$ws.socket.once('reconnect', () => {
        if (!this.$store.state.connected) this.$services.$emit('app:connected')
        this.$store.commit('connected', true)
      })
    })

    this.$ws.socket.on('heartbeat', () => {
      this.$ws.heartbeat = true
    })

    let checkHeartbeat = () => {
      if (!this.$ws.heartbeat) {
        // this.$store.commit('connected', false)
        console.log('disconnected')
      } else {
        // resset heartbeat
        this.$ws.heartbeat = false
        setTimeout(checkHeartbeat, 4000)
      }
    }

    setTimeout(checkHeartbeat, 4000)

    // watch connection errors
    this.$ws.socket.on('error', err => {
      console.log(err)
    })

    // get app version
    this.$modules.waitForService('utils').then(utils => {
      utils.info().then(result => {
        this.packageInfo = result
        // console.log(JSON.stringify(this.packageInfo))
      }).catch(err => console.log(err))
    }).catch(err => console.log(err))

    // get data version
    this.$modules.waitForService('data').then(data => {
      data.metas.get({ name: 'dataVersion' }).then(result => {
        this.dataInfo = result
        this.$forceUpdate()
        console.log('data version', JSON.stringify(this.dataInfo, null, 2))
      }).catch(err => console.log(err))
    })

    // theming
    this.$services.$on('app:toolbar:color', color => {
      this.$store.commit('toolbarColor', color)
    })

    this.$services.$on('app:toolbar:flat', flat => {
      this.$store.commit('flatToolbar', flat)
    })
  },
  computed: {
    logged() {
      return this.$store.state.user
    },
    user() {
      return this.$store.state.user || {}
    },
    connected() {
      return this.$store.state.connected
    },
    offline() {
      return this.$store.state.config && this.$store.state.config.offline ?
        this.$store.state.config.offline.activated : false
    },
    flatToolbar() {
      if (this.$store.state.user && this.$store.state.user.theming) {
        return this.$store.state.user.theming.flatToolbar
      } else {
        return this.$store.state.flatToolbar
      }
    },
    toolbarColor() {
      if (this.$store.state.user && this.$store.state.user.theming) {
        return this.$store.state.user.theming.toolbarColor
      } else {
        return this.$store.state.toolbarColor
      }
    },
    darkTheme() {
      if (this.$store.state.user && this.$store.state.user.theming) {
        return this.$store.state.user.theming.darkTheme
      } else {
        return this.$store.state.darkTheme
      }
    }
  }
}
</script>

<style>
.app {
  width: 100%;
  height: calc(100% - 0px);
  overflow: hidden;
}

.app-logo {
  width: 32px;
  height: 32px;
}

.app-view {
  width: 100%;
  height: calc(100% - 48px);
  overflow: hidden;
}

.app-router {
  width: 100%;
  height: calc(100% - 0px);
  overflow: hidden;
}

.app-toolbar {
  z-index: 1;
}

.app-menu-item-selected {
  color: dodgerblue;
}

.theme--dark .app-menu-item-selected {
  color: peru;
}

.app-menu-item-icon {
  display: flex !important;
  flex-flow: row !important;
  justify-content: flex-start !important;
}

.app-context-buttons {
  display: flex;
  height: 48px;
  margin-right: 8px;
  align-items: center;
}

.app-search {
  position: absolute;
  top: 56px;
  width: 100%;
  display: flex;
  justify-content: center;
  z-index: 10;
}

.app-search > div {
  max-width: 50%;
}

.app-search .v-text-field__details {
  display: none;
}

.app-search-handle {
  height: 48px;
  width: 36px;
  margin: 0 4px;
  border-radius: 2px;
  background-color: white;
  display: flex;
  flex-flow: column;
  justify-content: center;
  cursor: pointer;
}

.disconnected {
  display: flex;
  flex-flow: row;
  justify-content: center;
  align-items: center;
}

.app-sidebar-header {
  width: 100%;
  height: 168px;
  background-color: deepskyblue !important;
  background-image: url("~/assets/toto-256.png");
  background-size: cover;
}

.app-avatar {
  width: 318px;
  filter: drop-shadow(0 0 2px rgba(0, 0, 0, 0.8));
  font-weight: bold !important;
}

.app-user-contact {
  font-weight: bold;
}

.app-avatar-small {
  position: relative;
  padding: 0 12px 0 4px;
}

.app-notification-date {
  font-style: italic;
  color: slategrey;
}

.app-section {
  margin-left: 8px;
  font-size: 1.5em;
  color: gainsboro;
}

.theme--dark .app-section {
  color: slategrey;
}

@media screen and (max-width: 800px) {
  .app-search > div {
    max-width: calc(100% - 36px - 16px);
  }
}
</style>
