#!/usr/bin/env node

const cli = require('commander')
const chalk = require('chalk')
const fs = require('fs-extra')
const yaml = require('yaml')
const path = require('path')

let packageDef = fs.readFileSync(path.join(__dirname, '../package.json'), 'utf8')
let version = JSON.parse(packageDef).version

const readline = require('readline').createInterface({
  input: process.stdin,
  output: process.stdout
})

let newAppsConfig = yaml.parse(fs.readFileSync(path.join(__dirname, '../config/sample.yaml'), 'utf8'))
let appsConfig

const iioFolderPath = process.env.IIOS_CLI_CFG_PATH ||
  path.join('/home', process.env.USER, '.iio')

const appsCfgPath = process.env.IIOS_CLI_CFG_PATH ||
  path.join(iioFolderPath, 'apps-config.yml')

if (!fs.existsSync(iioFolderPath)) {
  fs.mkdirSync(iioFolderPath)
} else {
  // Manage older version overwrite based on old iio-cli config file
  if (fs.statSync(iioFolderPath).isFile()) {
    fs.unlinkSync(iioFolderPath)
    fs.mkdirSync(iioFolderPath)
  }
  // end
}

if (fs.existsSync(appsCfgPath)) {
  appsConfig = yaml.parse(fs.readFileSync(appsCfgPath, 'utf8'))

  if (appsConfig.version !== version) {
    readline.question('Keep existing configuration (Y/n): ', answer => {
      if (answer.toLowerCase() === 'n') {
        console.log(txtOrange('current configuration will be overwritten'))
        fs.unlinkSync(appsCfgPath)
        newAppsConfig.version = version
        fs.writeFileSync(appsCfgPath, yaml.stringify(newAppsConfig), 'utf8')
        appsConfig = newAppsConfig
      }

      readline.close()

      run()
    })
  } else {
    readline.close()
    run()
  }
} else {
  readline.close()

  newAppsConfig.version = version
  fs.writeFileSync(appsCfgPath, yaml.stringify(newAppsConfig), 'utf8')
  appsConfig = newAppsConfig
  run()
}

function run() {
  console.log('-------------------------------------------------------------------------------')
  console.log('IIOS CLI version ' + version)
  console.log('-------------------------------------------------------------------------------')

  let config = {
    apps: appsConfig,
    iioFolderPath: iioFolderPath
  }

  cli
    .version(version, '-v, --version')
    .usage('<command>')

  let commands = fs.readdirSync(path.join(__dirname, 'commands'))

  for (let c of commands) {
    require(path.join(__dirname, 'commands', c))(config)
  }

  cli
    .on('command:*', function (command) {
      const firstCommand = command[0]
      if (!this.commands.find(c => c._name == firstCommand)) {
          console.error('invalid command: %s\nsee --help for a list of available commands.', cli.args.join(' '))
          process.exit(1)
      }
    })

  if (!process.argv.slice(2).length) {
    cli.outputHelp()
  }

  cli.parse(process.argv)
}

function txtOrange(txt) {
  return chalk.rgb(255, 165, 0)(txt) // orange text
}
