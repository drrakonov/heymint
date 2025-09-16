import { rateLimit } from 'express-rate-limit'

const limiter = rateLimit({
	windowMs: 15 * 60 * 1000, 
	limit: 100,
	standardHeaders: 'draft-8',
	legacyHeaders: false,
	ipv6Subnet: 56,
})

export default limiter;