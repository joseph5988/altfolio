# Altfolio: Alternative Investments Tracker

A full-stack MERN application for tracking alternative investments including startups, crypto funds, collectibles, and farmland.

## Features

- **Authentication**: JWT-based login with admin and viewer roles
- **Security**: Rate limiting and input validation on authentication routes to prevent abuse and ensure data quality
- **Investment Management**: Add, edit, delete investments with shared ownership
- **Dashboard**: Real-time portfolio analytics with charts and filters
- **Business Logic**: Investment limits, ROI calculations, and role-based permissions

## Project Structure

```
altfolio/
├── client/          # React frontend
├── server/          # Express backend
└── README.md        # This file
```

## Tech Stack

- **Frontend**: React, Chart.js/Recharts, Bootstrap/Tailwind
- **Backend**: Express.js, MongoDB, Mongoose
- **Authentication**: JWT
- **Testing**: Jest
- **Security**: express-rate-limit, express-validator

## Setup Instructions

### Prerequisites
- Node.js (v14 or higher)
- MongoDB
- Git

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   cd client && npm install
   cd ../server && npm install
   ```
3. Set up environment variables
4. Start the development servers

## Development Phases

1. **Phase 1**: Project setup and basic structure ✅
2. **Phase 2**: Backend API development (authentication routes now include rate limiting and input validation)
3. **Phase 3**: Frontend authentication and basic UI
4. **Phase 4**: Investment management features
5. **Phase 5**: Dashboard and analytics
6. **Phase 6**: Testing and optimization

## Sample Users

- **Admin**: admin@altfolio.com / admin123
- **Viewer**: viewer@altfolio.com / viewer123

## API Endpoints

- `POST /api/auth/login` - User authentication (rate limited, input validated)
- `GET /api/investments` - Get all investments
- `POST /api/investments` - Create new investment
- `PUT /api/investments/:id` - Update investment
- `DELETE /api/investments/:id` - Delete investment
- `GET /api/dashboard` - Get dashboard analytics
- `POST /api/simulate` - Simulate value changes (bonus)

## Business Rules

- Investment limit: $1,000,000 for non-admin users
- ROI calculation: (currentValue - investedAmount) / investedAmount * 100
- Shared ownership support for investments
- Role-based permissions (admin vs viewer) 