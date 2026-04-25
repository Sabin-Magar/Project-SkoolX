# SkoolX - A School Management System
7th semester project

SkoolX is a web-based school management system built using the MERN stack.
It helps manage students, teachers, parents and announcements so on......

## Features
- Student management
- Teacher management
- Parent management
- Announcements
- Authentication (Login/Register)

## Dependencies Intsallation
- npm install

//(for tailwind css )
- npm install -D tailwindcss postcss autoprefixer 

//(for charts to be displayed in dashboard)
- npm install recharts 'OR' npm install recharts --legacy-peer-deps

//(for react calendar in the right side of dashboard)
- npm install react-calendar --legacy-peer-deps

//(for react big calendar of student dashboard--left section)
- npm install react-big-calendar --legacy-peer-deps
- npm i react-big-calendar moment --legacy-peer-deps
- npm install @types/react-big-calendar --legacy-peer-deps

//(for react hook form and zod)
- npm i react-hook-form -legacy-peer-deps
- npm i react-hook-form zod --legacy-peer-deps
- npm i react-hook-form zod @hookform/resolvers --legacy-peer-deps

//(for prisma orm)
- npm i prisma 'OR' npm i prisma --legacy-peer-deps
- npx prisma init 
- npx prisma migrate dev --name init (for connecting prisma to db)
- npm i -D ts-node --legacy-peer-deps
- npm install @prisma/client --legacy-peer-deps

- npm i -D tsx --legacy-peer-deps
- npm install prisma@6 @prisma/client@6 --legacy-peer-deps
- npx prisma generate

//(for clerk authentication)
- npm install @clerk/nextjs --legacy-peer-deps
- npm install @clerk/nextjs@6 --legacy-peer-deps
- npm install @clerk/elements --legacy-peer-deps

//(for pop up notification)
- npm i react-toastify --legacy-peer-deps