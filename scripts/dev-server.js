#!/usr/bin/env node

const { spawn } = require('child_process')
const fs = require('fs')
const path = require('path')

console.log('🚀 Starting Enhanced Development Server...')

// Kill any existing processes on port 3000
function killPort(port) {
  return new Promise((resolve) => {
    const kill = spawn('lsof', ['-ti', `:${port}`])
    kill.stdout.on('data', (data) => {
      const pids = data.toString().trim().split('\n')
      pids.forEach((pid) => {
        if (pid) {
          console.log(`🔪 Killing process ${pid} on port ${port}`)
          spawn('kill', ['-9', pid])
        }
      })
    })
    kill.on('close', () => {
      setTimeout(resolve, 1000)
    })
  })
}

// Clear Next.js cache
function clearCache() {
  const cachePaths = [
    path.join(process.cwd(), '.next'),
    path.join(process.cwd(), 'node_modules/.cache'),
  ]
  
  cachePaths.forEach((cachePath) => {
    if (fs.existsSync(cachePath)) {
      console.log(`🧹 Clearing cache: ${cachePath}`)
      fs.rmSync(cachePath, { recursive: true, force: true })
    }
  })
}

// Main function
async function startDevServer() {
  try {
    console.log('⚡ Cleaning up previous processes...')
    await killPort(3000)
    await killPort(3001)
    
    console.log('🧹 Clearing Next.js cache...')
    clearCache()
    
    console.log('📦 Installing dependencies...')
    const install = spawn('npm', ['install'], { stdio: 'inherit' })
    
    install.on('close', (code) => {
      if (code === 0) {
        console.log('✅ Dependencies installed successfully')
        console.log('🚀 Starting Next.js development server...')
        
        const nextDev = spawn('npm', ['run', 'dev'], { 
          stdio: 'inherit',
          env: { ...process.env, PORT: '3000' }
        })
        
        nextDev.on('close', (code) => {
          console.log(`Development server exited with code ${code}`)
        })
        
        nextDev.on('error', (err) => {
          console.error('Failed to start development server:', err)
        })
        
        // Handle graceful shutdown
        process.on('SIGINT', () => {
          console.log('\n🛑 Shutting down development server...')
          nextDev.kill('SIGINT')
          process.exit(0)
        })
        
      } else {
        console.error('❌ Failed to install dependencies')
        process.exit(1)
      }
    })
    
  } catch (error) {
    console.error('❌ Error starting development server:', error)
    process.exit(1)
  }
}

// Health check
function healthCheck() {
  setInterval(() => {
    const memUsage = process.memoryUsage()
    const memMB = Math.round(memUsage.rss / 1024 / 1024)
    
    if (memMB > 500) {
      console.log(`⚠️  High memory usage: ${memMB}MB`)
    }
  }, 30000) // Check every 30 seconds
}

// Start everything
startDevServer()
healthCheck()
