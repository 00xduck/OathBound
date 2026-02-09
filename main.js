import express from 'express'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

// initialise
const app = express()
// PORT
const PORT = process.env.PORT || 3000

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
// middleware
app.use(express.static(path.join(__dirname, 'public')))
app.use(express.json())

// routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'))
})

app.get('/game', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'game.html'))
})

app.get('/recipes', (req, res) => {
    const filePath = path.join(__dirname, 'public', 'data', 'recipes.json')
    res.sendFile(filePath)
})

app.get('/tutorial', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'tutorial', 'tutorial.html'))
})

app.listen(PORT, () => {
    console.log(`Server startet on http://localhost:${PORT}`);
})