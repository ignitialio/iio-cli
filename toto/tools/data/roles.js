module.exports = {
  admin: {
    roles: {
      'create:any': [ '*' ],
      'read:any': [ '*' ],
      'update:any': [ '*' ],
      'delete:any': [ '*' ]
    },
    users: {
      'create:any': [ '*' ],
      'read:any': [ '*' ],
      'update:any': [ '*' ],
      'delete:any': [ '*' ]
    },
    notifications: {
      'create:any': [ '*' ],
      'read:any': [ '*' ],
      'update:any': [ '*' ],
      'delete:any': [ '*' ]
    },
    connections: {
      'create:any': [ '*' ],
      'read:any': [ '*' ],
      'delete:any': [ '*' ]
    },
    metas: {
      'create:any': [ '*' ],
      'read:any': [ '*' ],
      'update:any': [ '*' ],
      'delete:any': [ '*' ]
    },
    myunified: {
      'update:any': [ 'myServiceMethod' ]
    }
  },
  user: {
    roles: {
      'read:any': [ '*' ]
    },
    users: {
      'read:any': [ '*' ],
      'update:own': [ '*', 'roles'],
      'delete:own': [ '*', 'roles']
    },
    notifications: {
      'create:own': [ '*' ],
      'read:own': [ '*' ],
      'update:own': [ '*' ],
      'delete:own': [ '*' ]
    },
    connections: {
      'create:any': [ '*' ],
      'read:any': [ '*' ]
    },
    metas: {
      'read:any': [ '*' ]
    },
    myunified: {
      'update:any': [ 'myServiceMethod' ]
    }
  },
  anonymous: {
    roles: {
      'read:any': [ '*' ]
    },
    users: {
      'read:any': [ '_id', 'role', 'firstname', 'lastname', 'avatar', 'password', '_lastModified', 'username' ]
    },
    metas: {
      'read:any': [ '*' ]
    }
  }
}
