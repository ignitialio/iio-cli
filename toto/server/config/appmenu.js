module.exports = {
  items: [
    {
      path: '/',
      title: 'Dashboard',
      icon: 'dashboard',
      anonymousAccess: false
    },
    {
      path: '/users',
      title: 'Users',
      icon: 'supervisor_account',
      anonymousAccess: false
    },
    {
      path: '/login',
      title: 'Sign in',
      icon: 'lock_outline',
      anonymousAccess: true,
      hideIfLogged: true
    },
    {
      path: '/logout',
      title: 'Sign out',
      icon: 'lock_open',
      anonymousAccess: false,
      handler: 'logout'
    }
  ],
  _unified: true
}
