const rolesData = require('../../data/roles')

const path = require('path')
const collectionName = path.basename(__filename).replace('populate_', '').replace('js', '')

exports.populate = async (db, resetOnly) => {
  console.log('updating ' + collectionName + '...')
  let roles = db.collection('roles')

  try {
    await roles.deleteMany({}) // reset
    console.log(collectionName + ' reset')
  } catch (err) {
    console.log(err)
  }

  if (resetOnly) return

  try {
    await roles.insertOne(rolesData, { w: 1 })
  } catch (err) {
    console.log(err)
  }

  console.log('...roles done')
}
