const express = require('express')
const jwt = require('jsonwebtoken')
const cors = require('cors')
const app = express()

app.use(express.json())
app.use(cors())

const users = [
    {
        id: 1,
        username: 'Habibie Yussuf',
        password: 'abogoboga',
        isAdmin: true
    },
    {
        id: 2,
        username: 'Susilo Yudhoyono',
        password: 'yeamploww',
        isAdmin: false
    },
    {
        id: 3,
        username: 'Joko Widodo',
        password: 'hutank',
        isAdmin: false
    }
]

let refreshTokens = []

app.post('/api/refresh', (req, res)=>{
    // take the refresh token from user
    console.log(req.body.token)
    const refreshToken = req.body.token
    // send error if there is no token or it's invalid
    if(!refreshToken) return res.status(401).json('tou are not authenticated')

    if (!refreshTokens.includes(refreshToken)) {
        return res.status(403).json('refresh token is not valid')
    }
    
    // if everything is ok, create new access token, refresh token and send to user 

    jwt.verify(refreshToken, 'myRefreshSecretKey', (err, user)=>{
        err && console.log(err)
        refreshTokens = refreshTokens.filter(token => token !== refreshToken)
        const newAccessToken = generateAccessToken(user)
        const newRefreshToken = generateRefreshToken(user)

        refreshTokens.push(newRefreshToken)
        res.status(200).json({
            accessToken: newAccessToken, refreshToken: newRefreshToken
        })
    })
})

const generateAccessToken =(user)=>{
    return jwt.sign({ id: user.id, isAdmin: user.isAdmin }, 'mySecretKey', { expiresIn: '2m' })
}

const generateRefreshToken =(user)=>{
    return jwt.sign({ id: user.id, isAdmin: user.isAdmin }, 'myRefreshSecretKey')
}

app.post('/api/login', (req, res)=>{
    const { username, password } = req.body
    console.log(req.body)
    const user = users.find(u =>{
        return u.username === username && u.password === password
    })

    if (user) {
        const accessToken = generateAccessToken(user)
        const refreshToken = generateRefreshToken(user)
        refreshTokens.push(refreshToken)
        res.json({ id: user.id, isAdmin: user.isAdmin, accessToken, refreshToken})
    } else {
        res.status(404).send('username or password incorected')
    }
})

const verify = (req, res, next)=>{
    const authHeader = req.headers.authorization
    //console.log(req.headers)
    if (authHeader) {
        const token = authHeader.split(' ')[1]
        jwt.verify(token, 'mySecretKey', (err, user)=>{
            if (err) {
                return res.status(403).json('token is not valid')
            } 
            req.user = user
            next()
        })
    } else {
        res.status(401).json('you are not athenticated')
    }
}

app.delete('/api/users/:userId', verify, (req, res)=>{
    if (req.user.id === req.params.userId || req.user.isAdmin) {
        res.status(200).json('user has been delete')
    } else {
        res.status(401).json('you are not allowed to delete this user')
    }
})

app.post('/api/logout', verify, (req, res)=>{
    const refreshToken = req.body.token
    refreshTokens = refreshTokens.filter(token => token !== refreshToken)
    res.status(200).json('you logged out successfully.')
})

app.listen(5000, ()=> console.log("Server Running"))